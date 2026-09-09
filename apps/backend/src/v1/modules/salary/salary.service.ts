import { IListParams, ListQueryParams } from "@rl/types";
import { ISalaryInput, Salary } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { salaryProjectQuery } from "./salary.query";

type IListSalaryParams = IListParams<ISalaryInput> & { offset?: number };
type ISalaryQueryParams = ListQueryParams<ISalaryInput>;

export const list = async ({ query = {}, options, offset = 0 }: IListSalaryParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const aggregate = Salary.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...salaryProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(await aggregate, limit);
};

/** How many match, ignoring paging. Only the legacy `?page=` branch needs this. */
export const count = ({ query = {} }: IListSalaryParams) =>
  Salary.countDocuments({ $and: [sanitizeQueryIds(query), { "deleteMarker.status": { $ne: true } }] });

export const getOne = async ({ query = {} }: IListSalaryParams) => {
  const results = await Salary.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...salaryProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Salary not found.");
  return results[0];
};

export const listSoftDeleted = ({ query = {}, options }: IListSalaryParams) => {
  return Salary.aggregatePaginate(
    Salary.aggregate([...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...salaryProjectQuery()]),
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListSalaryParams) => {
  const results = await Salary.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...salaryProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Salary not found in trash.");
  return results[0];
};

export const create = async (payload: ISalaryInput) => {
  const salary = new Salary(payload);
  return salary.save();
};

export const update = async ({ query, payload }: { query: ISalaryQueryParams; payload: Partial<ISalaryInput> }) => {
  const updated = await Salary.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updated) throw new NotFoundException("Salary not found.");
  return updated;
};

export const softRemove = async ({ query }: { query: ISalaryQueryParams }) => {
  const { deleted } = await Salary.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Salary not found to delete.");
  return getOneSoftDeleted({ query });
};

export const hardRemove = async ({ query }: { query: ISalaryQueryParams }) => {
  const result = await getOneSoftDeleted({ query });
  const deleted = await Salary.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Salary not found to delete.");
  return result;
};

export const restore = async ({ query }: { query: ISalaryQueryParams }) => {
  const { restored } = await Salary.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Salary not found in trash.");
  return getOne({ query });
};
