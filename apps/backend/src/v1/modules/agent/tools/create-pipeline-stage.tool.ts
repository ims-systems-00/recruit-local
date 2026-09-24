/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction } from "@rl/types";
import { StatusAuthZEntity } from "@rl/authz";
import { BadRequestException, UnauthorizedException } from "../../../../common/helper";
import { validateUpdatePayload } from "../../../../common/helper/authz";
import { objectIdValidation } from "../../../../common/helper/validate";
import { modelNames } from "../../../../models/constants";
import * as statusService from "../../status/status.service";
import { AgentTool, AgentToolContext, IToolPreview } from "./tool.types";
import { IBoard, isEmployer, readBoard, sameLabel } from "./pipeline.shared";

/**
 * Adds a column to a job's board.
 *
 * Two things this deliberately does not do. It never sets `default`: that flag
 * decides which column new applications arrive in, so an agent that could set it
 * could silently redirect every future applicant on the job — a change nobody
 * asked for and nobody would see happen. And it always appends, rather than
 * inserting at a position: reordering a board rewrites the weight of every
 * column on it, which is a bigger edit than "add a stage" and belongs to the
 * board itself, where the recruiter can see what moved.
 */

const HEX_COLOUR = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

interface CreatePipelineStageInput {
  jobId: string;
  label: string;
  backgroundColor?: string;
}

interface IResolvedCreate {
  board: IBoard;
  entity: StatusAuthZEntity;
  payload: Record<string, unknown>;
  tenantId: string | null;
}

/**
 * Everything both phases need, checked identically in both — so a duplicate
 * label is refused while it is still a proposal, and a column somebody else
 * added with that name between the preview and the confirmation is caught at
 * write time rather than creating the second "Interview" on the board.
 */
const resolve = async (input: CreatePipelineStageInput, ctx: AgentToolContext): Promise<IResolvedCreate> => {
  const board = await readBoard(input.jobId, ctx);
  const label = input.label.trim();

  const existing = board.stages.find((stage) => sameLabel(stage.label, label));

  if (existing) {
    // Names the job. A refusal that says only "this job" reads as settled when
    // the jobId was wrong in the first place, and the user is told their board
    // already has a stage that is in fact on somebody else's.
    throw new BadRequestException(
      `"${board.job?.title ?? "That job"}" already has a stage called "${existing.label}". ` +
        "Say which job you checked. If that is the one they meant, use the existing stage rather than adding a " +
        "second with the same name; if it is not, ask them which job they meant."
    );
  }

  // The status belongs to the tenant that owns the board, not to whoever asked
  // for it — the same rule the status controller applies.
  const tenantId = await statusService.getBoardTenantId(modelNames.JOB, input.jobId);
  const entity = new StatusAuthZEntity({ tenantId });

  if (!board.ability.can(AbilityAction.Create, entity)) {
    throw new UnauthorizedException("You are not authorized to add stages to this job's board.");
  }

  const payload: Record<string, unknown> = {
    collectionName: modelNames.JOB,
    collectionId: input.jobId,
    label,
    // Never from the model: see the note at the top of this file.
    default: false,
    ...(input.backgroundColor ? { backgroundColor: input.backgroundColor } : {}),
  };

  validateUpdatePayload(payload, board.ability, AbilityAction.Create, entity);

  return { board, entity, payload, tenantId };
};

export const createPipelineStageTool: AgentTool<CreatePipelineStageInput> = {
  name: "create_pipeline_stage",
  description:
    "Add a new stage (board column) to a job's hiring pipeline — for example a Phone Screen stage between Applied " +
    "and Interview. Call list_pipeline_stages first and only create a stage when none of the existing ones fits; " +
    "a second stage meaning the same thing splits the board. The new stage is added at the end of the board and " +
    "starts empty — creating it moves nobody, so use move_applications afterwards if they asked for both. " +
    "Nothing is created on the first call: you get back a preview to show them, and you call this again with the " +
    "returned confirmationToken once they have agreed.",

  parameters: {
    type: "object",
    properties: {
      jobId: {
        type: "string",
        description:
          "The job whose board gains the stage — the one the user is looking at or named, never one you chose. " +
          "If you do not know which job they mean, ask them before calling this.",
      },
      label: {
        type: "string",
        description: 'What the column is called, in the user\'s own words — for example "Phone Screen".',
      },
      backgroundColor: {
        type: "string",
        description:
          'Optional. The column colour as a hex code, for example "#E0F2FE". Only if the user asked for one.',
      },
    },
    required: ["jobId", "label"],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    jobId: Joi.string().custom(objectIdValidation).required().label("Job id"),
    label: Joi.string().trim().min(1).max(100).required().label("Stage name"),
    backgroundColor: Joi.string().trim().pattern(HEX_COLOUR).optional().label("Colour"),
  }),

  mutating: true,

  isAvailable: isEmployer,

  async preview(input, ctx): Promise<IToolPreview> {
    const { board, payload } = await resolve(input, ctx);
    const last = board.stages[board.stages.length - 1];

    return {
      summary: `Add a "${payload.label}" stage to ${board.job?.title ?? "this job"}`,
      details: {
        Job: board.job?.title ?? String(board.job?._id ?? ""),
        "New stage": payload.label,
        Position: last ? `last on the board, after ${last.label}` : "the board's first stage",
        ...(payload.backgroundColor ? { Colour: payload.backgroundColor } : {}),
      },
      warnings: ["The new stage starts empty — no applications are moved into it."],
    };
  },

  async execute(input, ctx: AgentToolContext) {
    const { board, payload, tenantId } = await resolve(input, ctx);

    const status = await statusService.create({ payload: { ...payload, tenantId } as any });

    return {
      created: true,
      stage: { _id: String(status._id), label: status.label },
      ...(board.job?.title ? { jobTitle: board.job.title } : {}),
      note: "Added at the end of the board, with no applications in it. Use move_applications to move people into it.",
    };
  },
};
