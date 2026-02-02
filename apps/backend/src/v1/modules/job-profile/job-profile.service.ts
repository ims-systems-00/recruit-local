import { IListParams, ListQueryParams } from "@rl/types";
import { JobProfile, JobProfileInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
// Assuming this query file exists following your pattern
import { jobProfileProjectQuery } from "./job-profile.query";

type IListJobProfileParams = IListParams<JobProfileInput>;
type IJobProfileQueryParams = ListQueryParams<JobProfileInput>;

export const list = ({ query = {}, options }: IListJobProfileParams) => {
  return JobProfile.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...jobProfileProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListJobProfileParams) => {
  const jobProfiles = await JobProfile.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...jobProfileProjectQuery(),
  ]);
  if (jobProfiles.length === 0) throw new NotFoundException("Job Profile not found.");
  return jobProfiles[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListJobProfileParams) => {
  return JobProfile.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...jobProfileProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListJobProfileParams) => {
  const jobProfiles = await JobProfile.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...jobProfileProjectQuery(),
  ]);
  if (jobProfiles.length === 0) throw new NotFoundException("Job Profile not found in trash.");
  return jobProfiles[0];
};

export const create = async (payload: JobProfileInput) => {
  let jobProfile = new JobProfile(payload);
  jobProfile = await jobProfile.save();
  return jobProfile;
};

export const update = async ({
  query,
  payload,
}: {
  query: IJobProfileQueryParams;
  payload: Partial<JobProfileInput>;
}) => {
  const updatedJobProfile = await JobProfile.findOneAndUpdate(
    sanitizeQueryIds(query),
    { $set: payload },
    { new: true }
  );

  if (!updatedJobProfile) throw new NotFoundException("Job Profile not found.");
  return updatedJobProfile;
};

export const softRemove = async ({ query }: { query: IJobProfileQueryParams }) => {
  const { deleted } = await JobProfile.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Job Profile not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: IJobProfileQueryParams }) => {
  const deletedJobProfile = await JobProfile.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedJobProfile) throw new NotFoundException("Job Profile not found to delete.");
  return deletedJobProfile;
};

export const restore = async ({ query }: { query: IJobProfileQueryParams }) => {
  const { restored } = await JobProfile.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Job Profile not found in trash.");
  return { restored };
};
