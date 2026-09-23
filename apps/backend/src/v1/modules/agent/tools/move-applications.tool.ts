/* eslint-disable @typescript-eslint/no-explicit-any */
import Joi from "joi";
import { AbilityAction } from "@rl/types";
import { ApplicationAbilityBuilder, ApplicationAuthZEntity } from "@rl/authz";
import { BadRequestException, ForbiddenException, NotFoundException } from "../../../../common/helper";
import { sanitizeDocuments, validateUpdatePayload } from "../../../../common/helper/authz";
import { objectIdValidation } from "../../../../common/helper/validate";
import * as applicationService from "../../application/application.service";
import { AgentTool, AgentToolContext, IToolPreview } from "./tool.types";
import { applicationFieldOptions, applicationSecurityQuery } from "./application.shared";
import { IBoard, isEmployer, readBoard, requireStage } from "./pipeline.shared";

/**
 * Moves applications from one pipeline stage to another — the conversational
 * equivalent of dragging cards across the board.
 *
 * Takes ids and never names, for the reason set out in `pipeline.shared.ts`:
 * stage names are per job, so a name the model matched itself is a name matched
 * against the wrong board eventually. The ids come from `list_pipeline_stages`
 * and `list_applications`, and because the confirmation token is signed over
 * exactly those ids, the candidates the user approved are the candidates moved.
 *
 * A batch rather than one card at a time: "move these three to interview" is one
 * intention, and splitting it into three gated calls would cost the user three
 * confirmations for the decision they already made once.
 */

const MAX_APPLICATIONS = 10;

interface MoveApplicationsInput {
  applicationIds: string[];
  statusId: string;
}

interface IResolvedMove {
  board: IBoard;
  stage: any;
  applications: any[];
  /** The ones already sitting in the target column, which the move leaves alone. */
  alreadyThere: any[];
}

/** How one application reads on a confirmation card. */
const describe = (application: any) => ({
  name: application.jobProfile?.name || application.reference || String(application._id),
  currentStage: application.status?.label ?? null,
});

const label = (application: any): string => {
  const { name, currentStage } = describe(application);
  return currentStage ? `${name} — currently ${currentStage}` : name;
};

/**
 * Everything both phases need, checked identically in both.
 *
 * Run from `preview` so an impossible move is refused while it is still a
 * proposal, and from `execute` so a board that changed between the two turns —
 * a column deleted, an application withdrawn — fails at write time rather than
 * writing against a stale approval.
 */
const resolve = async (input: MoveApplicationsInput, ctx: AgentToolContext): Promise<IResolvedMove> => {
  const ids = [...new Set(input.applicationIds.map(String))];

  const ability = new ApplicationAbilityBuilder(ctx.session).getAbility();

  if (!ability.can(AbilityAction.Read, ApplicationAuthZEntity)) {
    throw new ForbiddenException("You are not authorized to read applications.");
  }

  // Scoped, so an id belonging to another tenant simply does not come back —
  // indistinguishable from one that was never an application at all.
  const results = await applicationService.list({
    query: { $and: [{ _id: { $in: ids } }, applicationSecurityQuery(ability)] } as any,
    options: { limit: ids.length },
  });

  const applications = sanitizeDocuments<any>(
    results.docs,
    ability,
    AbilityAction.Read,
    ApplicationAuthZEntity,
    applicationFieldOptions
  );

  if (applications.length !== ids.length) {
    const found = new Set(applications.map((application) => String(application._id)));
    throw new NotFoundException(
      `No application available to this account for: ${ids.filter((id) => !found.has(id)).join(", ")}. ` +
        "Use list_applications to get application ids."
    );
  }

  for (const application of applications) {
    const entity = new ApplicationAuthZEntity(application);

    if (!ability.can(AbilityAction.Update, entity)) {
      throw new ForbiddenException(`You are not authorized to move ${describe(application).name}.`);
    }

    // The field-level half: an employer may write `statusId` and nothing else on
    // an application, and this is the check that says so.
    validateUpdatePayload({ statusId: input.statusId }, ability, AbilityAction.Update, entity);
  }

  const jobIds = [...new Set(applications.map((application) => String(application.jobId)))];

  if (jobIds.length > 1) {
    throw new BadRequestException(
      "Those applications are to different jobs, and each job has its own board with its own stages. " +
        "Move the applications for one job at a time."
    );
  }

  const board = await readBoard(jobIds[0], ctx);
  const stage = requireStage(board, input.statusId);

  return {
    board,
    stage,
    applications,
    alreadyThere: applications.filter((application) => String(application.statusId) === String(stage._id)),
  };
};

export const moveApplicationsTool: AgentTool<MoveApplicationsInput> = {
  name: "move_applications",
  description:
    "Move one or more job applications into a pipeline stage on their job's board — shortlisting someone, moving " +
    `them to interview, marking them rejected. Up to ${MAX_APPLICATIONS} at a time, all to the same stage, and all ` +
    "must be applications to the same job. Pass application ids from list_applications and a stage id from " +
    "list_pipeline_stages — never a stage name, and never an id you have not read back in this conversation. " +
    "Nothing is moved on the first call: you get back a preview to show them, and you call this again with the " +
    "returned confirmationToken once they have agreed.",

  parameters: {
    type: "object",
    properties: {
      applicationIds: {
        type: "array",
        items: { type: "string" },
        minItems: 1,
        maxItems: MAX_APPLICATIONS,
        description:
          "The `_id`s from list_applications of the applications to move. All must be applications to the same job.",
      },
      statusId: {
        type: "string",
        description: "The `_id` of the stage to move them into, from list_pipeline_stages for that same job.",
      },
    },
    required: ["applicationIds", "statusId"],
    additionalProperties: false,
  },

  inputSchema: Joi.object({
    applicationIds: Joi.array()
      .items(Joi.string().custom(objectIdValidation))
      .min(1)
      .max(MAX_APPLICATIONS)
      .required()
      .label("Applications"),
    statusId: Joi.string().custom(objectIdValidation).required().label("Stage"),
  }),

  mutating: true,

  isAvailable: isEmployer,

  async preview(input, ctx): Promise<IToolPreview> {
    const { board, stage, applications, alreadyThere } = await resolve(input, ctx);

    const warnings: string[] = [];

    if (alreadyThere.length === applications.length) {
      warnings.push(
        applications.length === 1
          ? `${describe(applications[0]).name} is already in ${stage.label}, so nothing will change.`
          : `All of these are already in ${stage.label}, so nothing will change.`
      );
    } else if (alreadyThere.length > 0) {
      warnings.push(
        `Already in ${stage.label}, and unaffected: ${alreadyThere.map((one) => describe(one).name).join(", ")}.`
      );
    }

    return {
      summary:
        applications.length === 1
          ? `Move ${describe(applications[0]).name} to ${stage.label}`
          : `Move ${applications.length} applications to ${stage.label}`,
      details: {
        Job: board.job?.title ?? String(board.job?._id ?? ""),
        "Moving to": stage.label,
        Applications: applications.map(label),
      },
      ...(warnings.length ? { warnings } : {}),
    };
  },

  async execute(input, ctx: AgentToolContext) {
    const { board, stage, applications } = await resolve(input, ctx);

    await applicationService.moveToStage({
      applicationIds: applications.map((application) => String(application._id)),
      statusId: String(stage._id),
    });

    return {
      moved: applications.length,
      stage: stage.label,
      ...(board.job?.title ? { jobTitle: board.job.title } : {}),
      applications: applications.map((application) => describe(application).name),
      note: "Moved. The board shows them in this stage now.",
    };
  },
};
