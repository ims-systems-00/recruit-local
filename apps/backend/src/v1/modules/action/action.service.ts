import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { IListParams } from "@rl/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { withTransaction } from "../../../common/helper/database-transaction";
import { actionProjectionQuery } from "./action.query";
import { IActionInput, Action } from "../../../models";

type IActionListParams = IListParams<IActionInput>;
type IActionQueryParams = Partial<IActionInput & { _id: string }>;

export const list = ({ query = {}, options }: IActionListParams) => {
  return Action.aggregatePaginate(
    [...matchQuery(query), ...excludeDeletedQuery(), ...actionProjectionQuery()],
    options
  );
};

export const getOne = async (query = {}) => {
  const action = await Action.aggregate([...matchQuery(query), ...excludeDeletedQuery(), ...actionProjectionQuery()]);
  if (action.length === 0) throw new NotFoundException("Action not found.");
  return action[0];
};

export const listSoftDeleted = async (query = {}) => {
  const action = await Action.aggregate([...matchQuery(query), ...onlyDeletedQuery(), ...actionProjectionQuery()]);
  if (action.length === 0) throw new NotFoundException("Action not found in trash.");
  return action[0];
};

export const getOneSoftDeleted = async (query = {}) => {
  const action = await Action.aggregate([...matchQuery(query), ...onlyDeletedQuery(), ...actionProjectionQuery()]);
  if (action.length === 0) throw new NotFoundException("Action not found in trash.");
  return action[0];
};

export const create = async (data: IActionInput) => {
  const action = new Action(data);
  await action.save();
  return action;
};

export const update = async (query: IActionQueryParams, data: Partial<IActionInput>) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const action = await Action.findOneAndUpdate(sanitizedQuery, data, { new: true });
  if (!action) throw new NotFoundException("Action not found for update.");
  return action;
};

export const softRemove = async (query: IActionQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const action = await Action.softDelete(sanitizedQuery);
  if (!action) throw new NotFoundException("Action not found for delete.");
  return action;
};

export const restore = async (query: IActionQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const action = await Action.restore(sanitizedQuery);
  if (!action) throw new NotFoundException("Action not found for restore.");
  return action;
};

export const hardRemove = async (query: IActionQueryParams) => {
  return withTransaction(async (session) => {
    const sanitizedQuery = sanitizeQueryIds(query);
    const action = await Action.findOneAndDelete(sanitizedQuery).session(session);
    if (!action) throw new NotFoundException("Action not found for hard delete.");
    return action;
  });
};
