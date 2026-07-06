import { IListParams, ListQueryParams } from "@rl/types";
import { IndustryInput, Industry } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { industryProjectQuery } from "./industry.query";

type IListIndustryParams = IListParams<IndustryInput>;
type IIndustryQueryParams = ListQueryParams<IndustryInput>;

export const list = ({ query = {}, options }: IListIndustryParams) => {
  return Industry.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...industryProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListIndustryParams) => {
  const results = await Industry.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...industryProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Industry not found.");
  return results[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListIndustryParams) => {
  return Industry.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...industryProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListIndustryParams) => {
  const results = await Industry.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...industryProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Industry not found in trash.");
  return results[0];
};

export const create = async (payload: IndustryInput) => {
  let industry = new Industry(payload);
  industry = await industry.save();
  return industry;
};

export const update = async ({
  query,
  payload,
}: {
  query: IIndustryQueryParams;
  payload: Partial<IndustryInput>;
}) => {
  const updated = await Industry.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updated) throw new NotFoundException("Industry not found.");
  return updated;
};

export const softRemove = async ({ query }: { query: IIndustryQueryParams }) => {
  const { deleted } = await Industry.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Industry not found to delete.");
  return getOneSoftDeleted({ query });
};

export const hardRemove = async ({ query }: { query: IIndustryQueryParams }) => {
  const result = await getOneSoftDeleted({ query });
  const deleted = await Industry.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Industry not found to delete.");
  return result;
};

export const restore = async ({ query }: { query: IIndustryQueryParams }) => {
  const { restored } = await Industry.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Industry not found in trash.");
  return getOne({ query });
};
