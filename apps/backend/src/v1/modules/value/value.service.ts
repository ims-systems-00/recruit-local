import { PipelineStage } from "mongoose";
import { IListParams, ListQueryParams } from "@rl/types";
import { ValueInput, Value } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { valueProjectQuery } from "./value.query";

type IListValueParams = IListParams<ValueInput> & { offset?: number };
type IValueQueryParams = ListQueryParams<ValueInput>;

export const list = async ({ query = {}, options, offset = 0 }: IListValueParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Value.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...valueProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

/** How many match, ignoring paging. Only the legacy `?page=` branch needs this. */
export const count = ({ query = {} }: IListValueParams) =>
  Value.countDocuments({ $and: [sanitizeQueryIds(query), { "deleteMarker.status": { $ne: true } }] });

export const getOne = async ({ query = {} }: IListValueParams) => {
  const results = await Value.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...valueProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Value not found.");
  return results[0];
};

export const listSoftDeleted = ({ query = {}, options }: IListValueParams) => {
  return Value.aggregatePaginate(
    Value.aggregate([...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...valueProjectQuery()]),
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListValueParams) => {
  const results = await Value.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...valueProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Value not found in trash.");
  return results[0];
};

export const topThree = ({ query = {} }: IListValueParams) => {
  const pipeline: PipelineStage[] = [
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    { $sort: { weight: -1, label: 1 } },
    { $limit: 3 },
    ...valueProjectQuery(),
  ];

  return Value.aggregate(pipeline);
};

export const create = async (payload: ValueInput) => {
  const value = new Value(payload);
  return value.save();
};

export const update = async ({ query, payload }: { query: IValueQueryParams; payload: Partial<ValueInput> }) => {
  const updated = await Value.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updated) throw new NotFoundException("Value not found.");
  return updated;
};

export const softRemove = async ({ query }: { query: IValueQueryParams }) => {
  const { deleted } = await Value.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Value not found to delete.");
  return getOneSoftDeleted({ query });
};

export const hardRemove = async ({ query }: { query: IValueQueryParams }) => {
  const result = await getOneSoftDeleted({ query });
  const deleted = await Value.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Value not found to delete.");
  return result;
};

export const restore = async ({ query }: { query: IValueQueryParams }) => {
  const { restored } = await Value.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Value not found in trash.");
  return getOne({ query });
};
