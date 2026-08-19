import Joi from "joi";
import { AbilityAction, JOBS_STATUS_ENUMS } from "@rl/types";
import { JobAbilityBuilder, JobAuthZEntity, ALL_JOB_FIELDS } from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { sanitizeDocuments } from "../../../../common/helper/authz";
import * as jobService from "../../job/job.service";
import { jobRoleScopedSecurityQuery } from "../../job/job.query";
import { AgentTool, AgentToolContext } from "./tool.types";
import { escapeRegex, present, JOB_SUMMARY_FIELDS } from "./tool.shared";

const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;

/**
 * `job.controller.list` searches the same free text, minus `company`, which is
 * not a field on the Job model and can never match. `category` is here instead
 * because it is how a job says "Marketing" or "Engineering".
 */
const SEARCH_FIELDS = ["title", "description", "location", "category"];

interface ListJobsInput {
  status?: JOBS_STATUS_ENUMS;
  search?: string;
  limit?: number;
}

/**
 * A case-insensitive contains-match across the fields worth searching.
 *
 * Built here rather than through `MongoQuery` as the REST list does: the builder
 * drops its `clientSearch` string into `$regex` verbatim, which is tolerable for
 * a query string typed by a user and not for one written by the model. The term
 * is escaped, so `c++` searches for the literal text instead of failing to
 * compile.
 */
const searchFilter = (search?: string): Record<string, unknown> => {
  const term = search?.trim();
  if (!term) return {};

  const pattern = { $regex: escapeRegex(term), $options: "i" };
  return { $or: SEARCH_FIELDS.map((field) => ({ [field]: pattern })) };
};

/**
 * The reference implementation for every future tool.
 *
 * Note there is no role branching. `JobAbilityBuilder` already encodes the
 * divergence: an employer reads every job in their own tenant with all fields,
 * a candidate reads OPEN jobs across all tenants minus the fields they may not
 * see (notably `additionalQueries.expectedAnswer`, the answer key to a job's
 * screening questions). Same code, two correct answers, enforced by CASL.
 */
export const listJobsTool: AgentTool<ListJobsInput> = {
  name: "list_jobs",
  description:
    "List job postings the user can see — employers their organisation's in any state, candidates open ones. " +
    "Use for which jobs exist, how many, or what they are called. " +
    "`search` finds a job the user named in words: every tool taking a `jobId` needs an id from here first. " +
    "Results are summaries — call get_job with an id for description, responsibilities or screening questions.",

  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: Object.values(JOBS_STATUS_ENUMS),
        description: "Optional. Restrict to jobs in this state. Candidates only ever see 'open'.",
      },
      search: {
        type: "string",
        description:
          "Optional. Case-insensitive text matched against title, description, location and category. Use the " +
          'distinctive words the user said — "React" finds it, "the senior React role we posted last week" matches nothing.',
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: MAX_LIMIT,
        description: `Optional. Max jobs to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`,
      },
    },
    required: [],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    status: Joi.string()
      .valid(...Object.values(JOBS_STATUS_ENUMS))
      .optional()
      .label("Status"),
    search: Joi.string().trim().min(1).max(200).optional().label("Search"),
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional().label("Limit"),
  }),

  mutating: false,

  async execute(input: ListJobsInput, ctx: AgentToolContext) {
    const ability = new JobAbilityBuilder(ctx.session).getAbility();

    if (!ability.can(AbilityAction.Read, JobAuthZEntity)) {
      throw new ForbiddenException("You are not authorized to read jobs.");
    }

    const filter = {
      ...(input.status ? { status: input.status } : {}),
      ...searchFilter(input.search),
    };

    const results = await jobService.list({
      query: { $and: [filter, jobRoleScopedSecurityQuery(ability)] },
      options: {
        page: 1,
        limit: Math.min(input.limit ?? DEFAULT_LIMIT, MAX_LIMIT),
        sort: { createdAt: -1 },
      },
      tenantId: ctx.session.tenantId,
      jobProfileId: ctx.session.jobProfileId,
    });

    const jobs = sanitizeDocuments<Record<string, unknown>>(results.docs, ability, AbilityAction.Read, JobAuthZEntity, {
      fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_FIELDS,
    });

    return {
      totalMatching: results.totalDocs,
      returned: jobs.length,
      // Narrowed after sanitization, not instead of it — see `present`.
      jobs: jobs.map((job) => present(job, JOB_SUMMARY_FIELDS)),
    };
  },
};
