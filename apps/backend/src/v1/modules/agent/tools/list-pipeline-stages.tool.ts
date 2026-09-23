/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction } from "@rl/types";
import { ApplicationAbilityBuilder, ApplicationAuthZEntity } from "@rl/authz";
import { objectIdValidation } from "../../../../common/helper/validate";
import * as applicationService from "../../application/application.service";
import { AgentTool, AgentToolContext } from "./tool.types";
import { applicationSecurityQuery } from "./application.shared";
import { isEmployer, readBoard, toStageSummary } from "./pipeline.shared";

/**
 * The board for one job: its columns, in order, with how many applications sit
 * in each.
 *
 * This is the tool that makes the two write tools safe to offer. Column names
 * are chosen per job, so the only way to name one reliably is to read the board
 * it is on — and both `move_applications` and `create_pipeline_stage` take ids
 * from here rather than names the model matched itself.
 */

interface ListPipelineStagesInput {
  jobId: string;
}

export const listPipelineStagesTool: AgentTool<ListPipelineStagesInput> = {
  name: "list_pipeline_stages",
  description:
    "List the hiring pipeline stages (board columns) for one job, in board order, with the number of applications " +
    "in each. Use it whenever the user asks what stages a job has, where candidates are in the process, or before " +
    "moving anyone: stage names are set per job, so the ids here are the only valid input to move_applications. " +
    "Call it again before creating a stage, to check the job does not already have one that fits.",

  parameters: {
    type: "object",
    properties: {
      jobId: {
        type: "string",
        description: "The job whose board to read. The `_id` from list_jobs, not a title.",
      },
    },
    required: ["jobId"],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    jobId: Joi.string().custom(objectIdValidation).required().label("Job id"),
  }),

  mutating: false,

  isAvailable: isEmployer,

  async execute(input: ListPipelineStagesInput, ctx: AgentToolContext) {
    const board = await readBoard(input.jobId, ctx);

    // Counted through the application ability rather than the status one: a
    // column is readable by the whole tenant, but the number beside it must be
    // the number of applications *this* caller could open.
    const applicationAbility = new ApplicationAbilityBuilder(ctx.session).getAbility();
    const canCount = applicationAbility.can(AbilityAction.Read, ApplicationAuthZEntity);
    const securityQuery = canCount ? applicationSecurityQuery(applicationAbility) : null;

    const stages = await Promise.all(
      board.stages.map(async (stage) => ({
        ...toStageSummary(stage),
        ...(securityQuery
          ? {
              applications: await applicationService.count({
                query: { $and: [{ statusId: String(stage._id) }, securityQuery] } as any,
              }),
            }
          : {}),
      }))
    );

    return {
      jobId: String(input.jobId),
      ...(board.job?.title ? { jobTitle: board.job.title } : {}),
      returned: stages.length,
      // Stated rather than left to be inferred from an empty array: a job whose
      // board has never been set up reads identically to one nobody has applied
      // to, and the model would report the wrong one.
      ...(stages.length === 0
        ? { note: "This job has no pipeline stages yet. One has to be created before applications can be moved." }
        : {}),
      stages,
    };
  },
};
