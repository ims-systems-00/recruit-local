import { IListParams, ListQueryParams } from "@rl/types";
import { JobTitleInput, JobTitle } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { jobTitleProjectQuery } from "./job-title.query";

type IListJobTitleParams = IListParams<JobTitleInput>;
type IJobTitleQueryParams = ListQueryParams<JobTitleInput>;

export const list = ({ query = {}, options }: IListJobTitleParams) => {
  return JobTitle.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...jobTitleProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListJobTitleParams) => {
  const results = await JobTitle.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...jobTitleProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Job title not found.");
  return results[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListJobTitleParams) => {
  return JobTitle.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...jobTitleProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListJobTitleParams) => {
  const results = await JobTitle.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...jobTitleProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Job title not found in trash.");
  return results[0];
};

export const create = async (payload: JobTitleInput) => {
  let jobTitle = new JobTitle(payload);
  jobTitle = await jobTitle.save();
  return jobTitle;
};

export const update = async ({
  query,
  payload,
}: {
  query: IJobTitleQueryParams;
  payload: Partial<JobTitleInput>;
}) => {
  const updated = await JobTitle.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updated) throw new NotFoundException("Job title not found.");
  return updated;
};

export const softRemove = async ({ query }: { query: IJobTitleQueryParams }) => {
  const { deleted } = await JobTitle.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Job title not found to delete.");
  return getOneSoftDeleted({ query });
};

export const hardRemove = async ({ query }: { query: IJobTitleQueryParams }) => {
  const result = await getOneSoftDeleted({ query });
  const deleted = await JobTitle.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Job title not found to delete.");
  return result;
};

export const restore = async ({ query }: { query: IJobTitleQueryParams }) => {
  const { restored } = await JobTitle.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Job title not found in trash.");
  return getOne({ query });
};
