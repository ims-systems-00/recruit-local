import Joi from "joi";
import { AbilityAction } from "@rl/types";
import { ApplicationAbilityBuilder, ApplicationAuthZEntity } from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { sanitizeDocuments } from "../../../../common/helper/authz";
import { modelNames } from "../../../../models/constants";
import * as applicationService from "../../application/application.service";
import * as statusService from "../../status/status.service";
import { AgentTool, AgentToolContext } from "./tool.types";
import {
  applicationFieldOptions,
  applicationSecurityQuery,
  readJobsById,
  toApplicationSummary,
} from "./application.shared";

const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;

/** Board columns are cheap and few; this only needs to be large enough to never truncate. */
const MAX_STAGE_MATCHES = 500;

interface ListApplicationsInput {
  jobId?: string;
  stage?: string;
  limit?: number;
}

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

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

  const results = await statusService.list({ query, options: { page: 1, limit: MAX_STAGE_MATCHES } });

  return (results.docs as { _id: unknown }[]).map((status) => String(status._id));
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
    "List job applications the current user is allowed to see, most recent first. " +
    "Employers see applications submitted to their own organisation's jobs; candidates see only the applications they " +
    "submitted themselves. " +
    "Use this to answer questions about who has applied, how many applications there are, which stage of the hiring " +
    "pipeline they are in, or what a candidate has applied to and when. " +
    "Each result is a summary — call get_application with an id from here to read a cover letter, the answers to a " +
    "job's screening questions, or the attached files. " +
    "Results are already restricted to what this user may access, so never assume an application is missing because of an error.",

  parameters: {
    type: "object",
    properties: {
      jobId: {
        type: "string",
        description:
          "Optional. Only return applications submitted to this job. This is the `_id` of a job as returned by " +
          "list_jobs, not a job title — look the title up first if the user named one.",
      },
      stage: {
        type: "string",
        description:
          "Optional. Only return applications sitting in this pipeline stage, matched case-insensitively against the " +
          'name of the board column (for example "Applied", "Interview", "Rejected"). Stage names are chosen per job, ' +
          "so a name that exists on one job may not exist on another.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: MAX_LIMIT,
        description: `Optional. Maximum number of applications to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}). The total number matching is always reported separately.`,
      },
    },
    required: [],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    jobId: Joi.string().hex().length(24).optional().label("Job id"),
    stage: Joi.string().trim().min(1).max(120).optional().label("Stage"),
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional().label("Limit"),
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

    const results = await applicationService.list({
      query: { $and: [filter, applicationSecurityQuery(ability)] },
      options: {
        page: 1,
        limit: Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
        sort: { createdAt: -1 },
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

    return {
      totalMatching: results.totalDocs,
      returned: applications.length,
      applications: applications.map((application) => toApplicationSummary(application, jobs)),
    };
  },
};
