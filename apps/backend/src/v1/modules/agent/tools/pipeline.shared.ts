/* eslint-disable @typescript-eslint/no-explicit-any */
import { ACCOUNT_TYPE_ENUMS, AbilityAction, ISession } from "@rl/types";
import { ALL_STATUS_FIELDS, StatusAbilityBuilder, StatusAuthZEntity } from "@rl/authz";
import { ForbiddenException, NotFoundException } from "../../../../common/helper";
import { sanitizeDocuments } from "../../../../common/helper/authz";
import { modelNames } from "../../../../models/constants";
import * as statusService from "../../status/status.service";
import { statusRoleScopedSecurityQuery } from "../../status/status.query";
import { AgentToolContext } from "./tool.types";
import { readJobById, rulesCollapsed } from "./tool.shared";

/**
 * The board behind the three pipeline tools: reading a job's columns, and the
 * checks all three share. Nothing here is a tool.
 *
 * A board column is a `Status` document keyed to a job — `{ collectionName:
 * "Job", collectionId: <jobId> }` — so every column name on the platform is
 * per-job. "Interview" is a different id on every board, which is why these
 * tools trade in ids and `list_pipeline_stages` exists to hand them out: a name
 * the model resolved itself would, sooner or later, resolve to another job's
 * column.
 */

/** Board columns are few by nature; large enough never to truncate a real board. */
const MAX_STAGES = 100;

export const statusFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_STATUS_FIELDS,
};

/**
 * The pipeline tools are offered to employers only.
 *
 * A prompt-economy filter, not the boundary — CASL grants candidates nothing on
 * `Status`, and an employer's own rules are scoped to their tenant, so a
 * candidate reaching one of these is refused by the ability check regardless.
 * This keeps three tools a candidate could never call out of their context.
 */
export const isEmployer = (session: ISession): boolean => session.user?.type === ACCOUNT_TYPE_ENUMS.EMPLOYER;

export interface IBoard {
  job: any;
  /** Live columns, in board order: first column first. */
  stages: any[];
  ability: ReturnType<StatusAbilityBuilder["getAbility"]>;
}

/**
 * A job's board, read through the caller's own abilities — the job through the
 * job ability, the columns through the status ability.
 *
 * The job read comes first and is what makes an id from another tenant
 * indistinguishable from one that does not exist: `readJobById` returns nothing
 * either way, and this throws the same message for both.
 */
export const readBoard = async (jobId: string, ctx: AgentToolContext): Promise<IBoard> => {
  const job = await readJobById(jobId, ctx.session);

  if (!job) {
    throw new NotFoundException("No job with that id is available to this account. Use list_jobs to get a job id.");
  }

  const ability = new StatusAbilityBuilder(ctx.session).getAbility();

  if (!ability.can(AbilityAction.Read, StatusAuthZEntity) || rulesCollapsed(ability, StatusAuthZEntity)) {
    throw new ForbiddenException("This account is not authorized to read hiring pipeline stages.");
  }

  const results = await statusService.list({
    query: {
      $and: [{ collectionName: modelNames.JOB, collectionId: String(jobId) }, statusRoleScopedSecurityQuery(ability)],
    } as any,
    options: { limit: MAX_STAGES, sort: "weight" },
  });

  const stages = sanitizeDocuments<any>(
    results.docs,
    ability,
    AbilityAction.Read,
    StatusAuthZEntity,
    statusFieldOptions
  );

  return { job, stages, ability };
};

/** One column of a board, as the model is shown it. */
export const toStageSummary = (stage: any) => ({
  _id: String(stage._id),
  label: stage.label,
  ...(stage.default === true ? { isDefault: true } : {}),
  ...(stage.backgroundColor ? { colour: stage.backgroundColor } : {}),
});

/**
 * Finds a column on a board by id.
 *
 * Refuses rather than returns nothing, and says how to recover: a model handed
 * "no such stage" will otherwise retry with a second guessed id.
 */
export const requireStage = (board: IBoard, statusId: string): any => {
  const stage = board.stages.find((candidate) => String(candidate._id) === String(statusId));

  if (!stage) {
    throw new NotFoundException(
      `That stage is not on this job's board. Call list_pipeline_stages for "${board.job?.title ?? "this job"}" and use an id it returned.`
    );
  }

  return stage;
};

/** Case- and space-insensitive, which is how a person compares two column names. */
export const sameLabel = (left: string, right: string): boolean =>
  String(left).trim().toLowerCase() === String(right).trim().toLowerCase();
