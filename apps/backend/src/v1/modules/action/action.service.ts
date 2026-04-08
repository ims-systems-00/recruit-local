import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { actionProjectionQuery } from "./action.query";
import { IActionInput, Action } from "../../../models";
import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";

// --- Standardized Parameter Interfaces ---
type IActionListParams = IServiceListParams<IActionInput>;
type IActionGetParams = IServiceGetParams<IActionInput>;
type IActionUpdateParams = IServiceUpdateParams<IActionInput>;
type IActionCreateParams = IServiceCreateParams<IActionInput>;

/**
 * List active actions with pagination
 */
export const list = ({ query = {}, options, session }: IActionListParams) => {
  const aggregate = Action.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...actionProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Action.aggregatePaginate(aggregate, options);
};

/**
 * Get a single active action
 */
export const getOne = async ({ query = {}, session }: IActionGetParams) => {
  const aggregate = Action.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...actionProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const actions = await aggregate;

  if (actions.length === 0) throw new NotFoundException("Action not found.");
  return actions[0];
};

/**
 * List soft-deleted actions with pagination
 */
export const listSoftDeleted = async ({ query = {}, options, session }: IActionListParams) => {
  const aggregate = Action.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...actionProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return Action.aggregatePaginate(aggregate, options);
};

/**
 * Get a single soft-deleted action
 */
export const getOneSoftDeleted = async ({ query = {}, session }: IActionGetParams) => {
  const aggregate = Action.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...actionProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const actions = await aggregate;

  if (actions.length === 0) throw new NotFoundException("Action not found in trash.");
  return actions[0];
};

/**
 * Create a new action
 */
export const create = async ({ payload, session }: IActionCreateParams) => {
  let action = new Action(payload);

  action = await action.save({ session });

  return action;
};

/**
 * Update an existing action
 */
export const update = async ({ query, payload, session }: IActionUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  // Use getOne to ensure the document exists and is NOT soft-deleted
  const actionToUpdate = await getOne({ query: sanitizedQuery, session });

  const action = await Action.findOneAndUpdate({ _id: actionToUpdate._id }, { $set: payload }, { new: true, session });

  if (!action) throw new NotFoundException("Action not found for update.");
  return action;
};

/**
 * Soft delete an action
 */
export const softRemove = async ({ query, session }: IActionGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { deleted } = await Action.softDelete(sanitizedQuery, { session });

  if (!deleted) throw new NotFoundException("Action not found for delete.");
  return { deleted };
};

/**
 * Restore a soft-deleted action
 */
export const restore = async ({ query, session }: IActionGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { restored } = await Action.restore(sanitizedQuery, { session });

  if (!restored) throw new NotFoundException("Action not found for restore.");
  return { restored };
};

/**
 * Hard delete an action completely from the database
 */
export const hardRemove = async ({ query, session }: IActionGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  // Verify it exists in the trash first before hard deleting
  const actionToDelete = await getOneSoftDeleted({ query: sanitizedQuery, session });

  const action = await Action.findOneAndDelete({ _id: actionToDelete._id }, { session });

  if (!action) throw new NotFoundException("Action not found for hard delete.");
  return action;
};
