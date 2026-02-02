import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { IListParams, ListQueryParams } from "@rl/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { withTransaction } from "../../../common/helper/database-transaction";
import { statusProjectionQuery } from "./status.query";
import { IStatusDoc, IStatusInput, Status } from "../../../models";

type IStatusListParams = IListParams<IStatusInput>;
type IStatusQueryParams = ListQueryParams<IStatusInput>;

export const list = ({ query = {}, options }: IStatusListParams) => {
  return Status.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...statusProjectionQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IStatusQueryParams): Promise<IStatusDoc> => {
  const status = await Status.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...statusProjectionQuery(),
  ]);
  if (status.length === 0) throw new NotFoundException("Status not found.");
  return status[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IStatusListParams) => {
  return Status.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...statusProjectionQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IStatusListParams) => {
  const status = await Status.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...statusProjectionQuery(),
  ]);
  if (status.length === 0) throw new NotFoundException("Status not found in trash.");
  return status[0];
};

export const create = async (payload: IStatusInput) => {
  let status = new Status(payload);
  status = await status.save();
  return status;
};

export const update = async ({ query, payload }: { query: IStatusQueryParams; payload: Partial<IStatusInput> }) => {
  const updatedStatus = await Status.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updatedStatus) throw new NotFoundException("Status not found for update.");
  return updatedStatus;
};

export const softRemove = async ({ query }: { query: IStatusQueryParams }) => {
  const { deleted } = await Status.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Status not found to delete.");
  return { deleted };
};

export const restore = async ({ query }: { query: IStatusQueryParams }) => {
  const { restored } = await Status.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Status not found in trash.");
  return { restored };
};

export const hardRemove = async ({ query }: { query: IStatusQueryParams }) => {
  // Transaction isn't strictly necessary for a single atomic delete, but keeping it if you prefer safety
  return withTransaction(async (session) => {
    const status = await Status.findOneAndDelete(sanitizeQueryIds(query)).session(session);
    if (!status) throw new NotFoundException("Status not found for hard delete.");
    return status;
  });
};
