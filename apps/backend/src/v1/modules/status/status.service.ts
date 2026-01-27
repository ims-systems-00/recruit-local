import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { IListParams } from "@rl/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { withTransaction } from "../../../common/helper/database-transaction";
import { statusProjectionQuery } from "./status.query";
import { IStatusDoc, IStatusInput, Status } from "../../../models";

type IStatusListParams = IListParams<IStatusInput>;
type IStatusQueryParams = Partial<IStatusInput & { _id: string }>;

export const list = ({ query = {}, options }: IStatusListParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  return Status.aggregatePaginate(
    [...matchQuery(sanitizedQuery), ...excludeDeletedQuery(), ...statusProjectionQuery()],
    options
  );
};

export const getOne = async (query = {}): Promise<IStatusDoc> => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const status = await Status.aggregate([
    ...matchQuery(sanitizedQuery),
    ...excludeDeletedQuery(),
    ...statusProjectionQuery(),
  ]);
  if (status.length === 0) throw new NotFoundException("Status not found.");
  return status[0];
};

export const listSoftDeleted = async (query = {}) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const status = await Status.aggregate([
    ...matchQuery(sanitizedQuery),
    ...onlyDeletedQuery(),
    ...statusProjectionQuery(),
  ]);
  return status;
};

export const getOneSoftDeleted = async (query = {}) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const status = await Status.aggregate([
    ...matchQuery(sanitizedQuery),
    ...onlyDeletedQuery(),
    ...statusProjectionQuery(),
  ]);
  if (status.length === 0) throw new NotFoundException("Status not found in trash.");
  return status[0];
};

export const create = async (data: IStatusInput) => {
  const status = new Status(data);
  await status.save();
  return status;
};

export const update = async (query: IStatusQueryParams, data: Partial<IStatusInput>) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const status = await Status.findOneAndUpdate(sanitizedQuery, data, { new: true });
  if (!status) throw new NotFoundException("Status not found for update.");
  return status;
};

export const softRemove = async (query: IStatusQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const status = await Status.softDelete(sanitizedQuery);
  if (!status) throw new NotFoundException("Status not found for delete.");
  return status;
};

export const restore = async (query: IStatusQueryParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const status = await Status.restore(sanitizedQuery);
  if (!status) throw new NotFoundException("Status not found for restore.");
  return status;
};

export const hardRemove = async (query: IStatusQueryParams) => {
  return withTransaction(async (session) => {
    const sanitizedQuery = sanitizeQueryIds(query);
    const status = await Status.findOneAndDelete(sanitizedQuery).session(session);
    if (!status) throw new NotFoundException("Status not found for hard delete.");
    return status;
  });
};
