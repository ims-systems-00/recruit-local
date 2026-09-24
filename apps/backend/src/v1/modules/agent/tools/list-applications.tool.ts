import Joi from "joi";
import { permittedFieldsOf } from "@casl/ability/extra";
import { AbilityAction } from "@rl/types";
import { ApplicationAbilityBuilder, ApplicationAuthZEntity } from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { sanitizeDocuments } from "../../../../common/helper/authz";
import { modelNames } from "../../../../models/constants";
import { JobProfile } from "../../../../models";
import * as applicationService from "../../application/application.service";
import * as statusService from "../../status/status.service";
import { AgentTool, AgentToolContext } from "./tool.types";
import {
  applicationFieldOptions,
  applicationSecurityQuery,
  readJobsById,
  toApplicationSummary,
} from "./application.shared";
import { escapeRegex } from "./tool.shared";

const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;

/** Board columns are cheap and few; this only needs to be large enough to never truncate. */
const MAX_STAGE_MATCHES = 500;

/**
 * Cap on the profiles one name resolves to. A first name on a large tenant can
 * match many people; this bounds the `$in` rather than the answer, which the
 * caller's `limit` still governs.
 */
const MAX_CANDIDATE_MATCHES = 200;

interface ListApplicationsInput {
  jobId?: string;
  stage?: string;
  candidate?: string;
  limit?: number;
  sortBy?: "recent" | "match";
}

/**
 * Resolves a pipeline stage name to the status ids that carry it.
 *
 * Board columns are per-job `Status` documents, so "Interview" is a different id
 * on every job and matching one name has to mean matching a set. Ids belonging
 * to other tenants are harmless in the `$in`: the security query still has to
 * match the application itself for a row to come back.
 */
const statusIdsForStage = async (stage: string): Promise<string[]> => {
  // Loosely typed because `ListQueryParams` types `label` as the model's own
  // `string`, leaving no room for an operator. The service still runs it through
  // `matchQuery` / `sanitizeQueryIds` like any other filter.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query: any = {
    collectionName: modelNames.JOB,
    label: { $regex: `^${escapeRegex(stage.trim())}$`, $options: "i" },
  };

  const results = await statusService.list({ query, options: { limit: MAX_STAGE_MATCHES } });

  return (results.docs as { _id: unknown }[]).map((status) => String(status._id));
};

/**
 * Resolves what the user called someone into `$or` clauses matching their
 * applications.
 *
 * A candidate's name lives on their job profile, which the list pipeline only
 * joins *after* `$match`, so it cannot be filtered in the initial stage. The
 * name is therefore resolved to profile ids first and applied as an `$in` — the
 * same shape as `statusIdsForStage`, and safe for the same reason: profiles
 * belonging to another tenant are harmless in the `$in`, because the security
 * query still has to match the application itself for a row to come back. Only
 * `_id` is read here; no profile data reaches the model by this path.
 *
 * A reference is matched too, since "APP-67" is what the model is handed in
 * every result and is the one identifier a recruiter can quote back.
 */
const candidateClauses = async (candidate: string): Promise<Record<string, unknown>[]> => {
  const term = candidate.trim();

  const profiles = await JobProfile.find({ name: { $regex: escapeRegex(term), $options: "i" } })
    .select("_id")
    .limit(MAX_CANDIDATE_MATCHES)
    .lean();

  const clauses: Record<string, unknown>[] = [];

  if (profiles.length > 0) {
    clauses.push({ jobProfileId: { $in: profiles.map((profile) => String(profile._id)) } });
  }

  // A bare number is how a reference gets quoted once the prefix feels obvious.
  const reference = /^\d+$/.test(term) ? `APP-${term}` : term;
  clauses.push({ reference: { $regex: `^${escapeRegex(reference)}$`, $options: "i" } });

  return clauses;
};

/**
 * The other half of list_jobs: jobs are what an employer posts, applications are
 * what comes back.
 *
 * As in every tool here there is no role branching. `ApplicationAbilityBuilder`
 * already encodes the split — an employer reads every application against their
 * own tenant's jobs, a candidate reads only the ones they submitted — so the
 * same call answers both correctly.
 */
export const listApplicationsTool: AgentTool<ListApplicationsInput> = {
  name: "list_applications",
  description:
    "List job applications the user can see — employers those to their organisation's jobs, candidates their own. " +
    "Use for who has applied, how many, what stage they are in, what a candidate applied to, or to find one " +
    "person's application by name before acting on it. " +
    "Results carry `matchScore` out of `matchScoreOutOf`; higher is a better fit. A `matchScore` of 0 or absent " +
    "means not yet scored, not a poor fit — say the score is unavailable rather than ranking it last. " +
    "Each result is a summary — call get_application with an id for a cover letter, screening answers or files.",

  parameters: {
    type: "object",
    properties: {
      jobId: {
        type: "string",
        description: "Optional. Only applications to this job. The `_id` from list_jobs, not a title.",
      },
      stage: {
        type: "string",
        description:
          "Optional. Pipeline stage, matched case-insensitively against the board column name (for example " +
          '"Applied", "Interview"). Stage names are chosen per job.',
      },
      candidate: {
        type: "string",
        description:
          "Optional. A candidate's name, or part of it, matched case-insensitively — or an application reference " +
          'like "APP-67". Use this to find one person rather than paging through a stage. One person can have more ' +
          "than one application, so check what comes back before acting on it.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: MAX_LIMIT,
        description: `Optional. Max applications to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`,
      },
      sortBy: {
        type: "string",
        enum: ["recent", "match"],
        description:
          'Optional. "recent" (default) newest first; "match" ranks by `matchScore`. Only `limit` results come ' +
          'back, so use "match" for any question about who ranks best or who to look at first.',
      },
    },
    required: [],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    jobId: Joi.string().hex().length(24).optional().label("Job id"),
    stage: Joi.string().trim().min(1).max(120).optional().label("Stage"),
    candidate: Joi.string().trim().min(1).max(120).optional().label("Candidate"),
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional().label("Limit"),
    sortBy: Joi.string().valid("recent", "match").optional().label("Sort by"),
  }),

  mutating: false,

  async execute(input: ListApplicationsInput, ctx: AgentToolContext) {
    const ability = new ApplicationAbilityBuilder(ctx.session).getAbility();

    if (!ability.can(AbilityAction.Read, ApplicationAuthZEntity)) {
      throw new ForbiddenException("You are not authorized to read applications.");
    }

    const filter: Record<string, unknown> = {};
    if (input.jobId) filter.jobId = input.jobId;

    if (input.stage) {
      const statusIds = await statusIdsForStage(input.stage);

      // Reported rather than returned as an empty list, which the model would
      // otherwise read as "nobody is at that stage" instead of "no such stage".
      if (statusIds.length === 0) {
        return {
          totalMatching: 0,
          returned: 0,
          applications: [],
          note: `No pipeline stage named "${input.stage}" exists on any job. Stage names are set per job.`,
        };
      }

      filter.statusId = { $in: statusIds };
    }

    if (input.candidate) {
      filter.$or = await candidateClauses(input.candidate);
    }

    // Asked for by the same mechanism that strips the field from the response,
    // so the two can never disagree. A candidate's read fields omit
    // `matchScore`; ordering their applications by a score they are not shown
    // would leak its relative values back to them, so they get recency instead.
    const askedForMatch = input.sortBy === "match";
    const canReadMatchScore = permittedFieldsOf(
      ability,
      AbilityAction.Read,
      ApplicationAuthZEntity,
      applicationFieldOptions
    ).includes("matchScore");
    const sortByMatch = askedForMatch && canReadMatchScore;

    // Hoisted so the total below counts exactly what the page was drawn from.
    const query = { $and: [filter, applicationSecurityQuery(ability)] };

    const results = await applicationService.list({
      query,
      options: {
        limit: Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
        // Recency breaks ties so the order is total, not just best-first.
        sort: sortByMatch ? "-matchScore -createdAt" : "-createdAt",
      },
    });

    const applications = sanitizeDocuments<Record<string, unknown>>(
      results.docs,
      ability,
      AbilityAction.Read,
      ApplicationAuthZEntity,
      applicationFieldOptions
    );

    const jobs = await readJobsById(
      applications.map((application) => (application.jobId != null ? String(application.jobId) : "")),
      ctx.session
    );

    // Collected rather than assigned one at a time: two of these can be true on
    // the same call, and a second `note` key would silently replace the first.
    const notes: string[] = [];

    // Stated rather than left silent: unexplained recency order would be read
    // as a ranking, and the top row reported as the best candidate.
    if (askedForMatch && !canReadMatchScore) {
      notes.push("Match scores are not available to this account, so these are ordered most recent first instead.");
    }

    // Distinguishes "nobody by that name" from "nobody at that stage", which an
    // empty list alone does not — and which lead to opposite replies.
    if (input.candidate && applications.length === 0) {
      notes.push(
        `No application here matches "${input.candidate}". Names come from the candidate's own profile, so check ` +
          "the spelling with the user, or list the stage and read the names back to them."
      );
    }

    return {
      // `list` no longer returns a total — a cursor page skips the $count
      // branch on purpose — so ask for one explicitly.
      totalMatching: await applicationService.count({ query }),
      returned: applications.length,
      applications: applications.map((application) => toApplicationSummary(application, jobs)),
      ...(notes.length > 0 ? { note: notes.join(" ") } : {}),
    };
  },
};
