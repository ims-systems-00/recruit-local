import { IListParams, ListQueryParams } from "@rl/types";
import { JobProfile, JobProfileInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
// Assuming this query file exists following your pattern
import { jobProfileProjectQuery } from "./job-profile.query";
import * as StatusService from "../status/status.service";
import { modelNames } from "../../../models/constants";

type IListJobProfileParams = IListParams<JobProfileInput>;
type IJobProfileQueryParams = ListQueryParams<JobProfileInput>;

export const list = ({ query = {}, options }: IListJobProfileParams) => {
  return JobProfile.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...excludeDeletedQuery(),
      ...populateStatusQuery(),
      ...jobProfileProjectQuery(),
    ],
    options
  );
};

export const getOne = async ({ query = {} }: IListJobProfileParams) => {
  const jobProfiles = await JobProfile.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateStatusQuery(),
    ...jobProfileProjectQuery(),
  ]);
  if (jobProfiles.length === 0) throw new NotFoundException("Job Profile not found.");
  return jobProfiles[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListJobProfileParams) => {
  return JobProfile.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...onlyDeletedQuery(),
      ...populateStatusQuery(),
      ...jobProfileProjectQuery(),
    ],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListJobProfileParams) => {
  const jobProfiles = await JobProfile.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...jobProfileProjectQuery(),
  ]);
  if (jobProfiles.length === 0) throw new NotFoundException("Job Profile not found in trash.");
  return jobProfiles[0];
};

export const create = async (payload: JobProfileInput) => {
  const statusExists = await StatusService.getOne({
    query: { collectionName: modelNames.JOB_PROFILE, label: "unverified" },
  });
  payload.statusId = statusExists._id as unknown as typeof payload.statusId;

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
  if (payload.statusId) {
    const statusExists = await StatusService.getOne({
      query: { _id: payload.statusId, collectionName: modelNames.JOB_PROFILE },
    });
    payload.statusId = statusExists._id as unknown as typeof payload.statusId;
  }
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
