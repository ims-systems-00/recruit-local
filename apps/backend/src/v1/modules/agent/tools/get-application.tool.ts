import Joi from "joi";
import { AbilityAction } from "@rl/types";
import { ApplicationAbilityBuilder, ApplicationAuthZEntity } from "@rl/authz";
import { ForbiddenException } from "../../../../common/helper";
import { sanitizeDocument } from "../../../../common/helper/authz";
import * as applicationService from "../../application/application.service";
import { AgentTool, AgentToolContext } from "./tool.types";
import {
  applicationFieldOptions,
  applicationSecurityQuery,
  readJobsById,
  toApplicationDetail,
} from "./application.shared";

interface GetApplicationInput {
  applicationId: string;
}

/**
 * The detail view behind list_applications.
 *
 * Note the fetch: the security query is part of the `$match` rather than a check
 * run against a document already loaded, as application.controller.get does.
 * Same authorization outcome, but an id belonging to someone else comes back
 * "not found" instead of "forbidden", so the model cannot use the difference to
 * confirm that an application it may not read exists. The row check afterwards
 * is redundant on purpose — the query is scoped from the ability's rules, the
 * check from the document, and a leak needs both to be wrong.
 */
export const getApplicationTool: AgentTool<GetApplicationInput> = {
  name: "get_application",
  description:
    "Get the full detail of a single job application, including its cover letter, the candidate's answers to the job's " +
    "screening questions, salary figures and the names of any attached files. " +
    "Take the id from list_applications first — this accepts only an application's `_id`, not a job title, a reference " +
    "code or a candidate's name. " +
    "Employers can only open applications made to their own organisation's jobs, and candidates only their own; an " +
    "application outside that is reported as not found.",

  parameters: {
    type: "object",
    properties: {
      applicationId: {
        type: "string",
        description: "Required. The `_id` of the application, as returned in the results of list_applications.",
      },
    },
    required: ["applicationId"],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    applicationId: Joi.string().hex().length(24).required().label("Application id"),
  }),

  mutating: false,

  async execute(input: GetApplicationInput, ctx: AgentToolContext) {
    const ability = new ApplicationAbilityBuilder(ctx.session).getAbility();

    if (!ability.can(AbilityAction.Read, ApplicationAuthZEntity)) {
      throw new ForbiddenException("You are not authorized to read applications.");
    }

    // Throws NotFoundException when the id does not exist or is not this
    // caller's to read — the two are indistinguishable by design.
    const application = await applicationService.getOne({
      query: { $and: [{ _id: input.applicationId }, applicationSecurityQuery(ability)] },
    });

    if (!ability.can(AbilityAction.Read, new ApplicationAuthZEntity(application))) {
      throw new ForbiddenException("You do not have permission to view this application.");
    }

    const sanitized = sanitizeDocument<Record<string, unknown>>(
      application,
      ability,
      AbilityAction.Read,
      ApplicationAuthZEntity,
      applicationFieldOptions
    );

    const jobId = sanitized.jobId != null ? String(sanitized.jobId) : "";
    const jobs = await readJobsById([jobId], ctx.session);

    return toApplicationDetail(sanitized, jobs[jobId]);
  },
};
