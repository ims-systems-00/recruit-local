import { IListParams, ListQueryParams } from "@rl/types";
import { ValueInput, Value } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { valueProjectQuery } from "./value.query";

type IListValueParams = IListParams<ValueInput>;
type IValueQueryParams = ListQueryParams<ValueInput>;

export const list = ({ query = {}, options }: IListValueParams) => {
  return Value.aggregatePaginate(
    Value.aggregate([...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...valueProjectQuery()]),
    options
  );
};

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
