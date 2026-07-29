import Joi from "joi";
import { AbilityAction, JOBS_STATUS_ENUMS } from "@rl/types";
import { JobAbilityBuilder, JobAuthZEntity, ALL_JOB_FIELDS } from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { sanitizeDocuments } from "../../../../common/helper/authz";
import * as jobService from "../../job/job.service";
import { jobRoleScopedSecurityQuery } from "../../job/job.query";
import { AgentTool, AgentToolContext } from "./tool.types";

const MAX_LIMIT = 25;
const DEFAULT_LIMIT = 10;

interface ListJobsInput {
  status?: JOBS_STATUS_ENUMS;
  limit?: number;
}

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
    "List job postings the current user is allowed to see, most recent first. " +
    "Employers see their own organisation's jobs in any state; candidates see jobs that are open for applications. " +
    "Use this to answer questions about which jobs exist, how many there are, or what they are called. " +
    "Results are already restricted to what this user may access, so never assume a job is missing because of an error.",

  parameters: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: Object.values(JOBS_STATUS_ENUMS),
        description:
          "Optional. Restrict to jobs in this state. Omit to list every job the user can see. " +
          "Candidates can only ever see 'open' jobs, so this is mainly useful for employers.",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: MAX_LIMIT,
        description: `Optional. Maximum number of jobs to return (default ${DEFAULT_LIMIT}, max ${MAX_LIMIT}).`,
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
    limit: Joi.number().integer().min(1).max(MAX_LIMIT).optional().label("Limit"),
  }),

  mutating: false,

  async execute(input: ListJobsInput, ctx: AgentToolContext) {
    const ability = new JobAbilityBuilder(ctx.session).getAbility();

    if (!ability.can(AbilityAction.Read, JobAuthZEntity)) {
      throw new ForbiddenException("You are not authorized to read jobs.");
    }

    const filter = input.status ? { status: input.status } : {};

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

    const jobs = sanitizeDocuments<JobAuthZEntity>(results.docs, ability, AbilityAction.Read, JobAuthZEntity, {
      fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_FIELDS,
    });

    return {
      totalMatching: results.totalDocs,
      returned: jobs.length,
      jobs,
    };
  },
};
