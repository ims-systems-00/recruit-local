import { IListParams, ListQueryParams } from "@rl/types";
import { WorkModeInput, WorkMode } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { workModeProjectQuery } from "./work-mode.query";

type IListWorkModeParams = IListParams<WorkModeInput>;
type IWorkModeQueryParams = ListQueryParams<WorkModeInput>;

export const list = ({ query = {}, options }: IListWorkModeParams) => {
  return WorkMode.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...workModeProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListWorkModeParams) => {
  const results = await WorkMode.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...workModeProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Work mode not found.");
  return results[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListWorkModeParams) => {
  return WorkMode.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...workModeProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListWorkModeParams) => {
  const results = await WorkMode.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...workModeProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Work mode not found in trash.");
  return results[0];
};

export const create = async (payload: WorkModeInput) => {
  let workMode = new WorkMode(payload);
  workMode = await workMode.save();
  return workMode;
};

export const update = async ({
  query,
  payload,
}: {
  query: IWorkModeQueryParams;
  payload: Partial<WorkModeInput>;
}) => {
  const updated = await WorkMode.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updated) throw new NotFoundException("Work mode not found.");
  return updated;
};

export const softRemove = async ({ query }: { query: IWorkModeQueryParams }) => {
  const { deleted } = await WorkMode.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Work mode not found to delete.");
  return getOneSoftDeleted({ query });
};

export const hardRemove = async ({ query }: { query: IWorkModeQueryParams }) => {
  const result = await getOneSoftDeleted({ query });
  const deleted = await WorkMode.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Work mode not found to delete.");
  return result;
};

export const restore = async ({ query }: { query: IWorkModeQueryParams }) => {
  const { restored } = await WorkMode.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Work mode not found in trash.");
  return getOne({ query });
};
