import { Types } from "mongoose";
import { IListParams, ListQueryParams, VISIBILITY_ENUM } from "@rl/types";
import { JobProfile, JobProfileInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { jobProfileProjectQuery } from "./job-profile.query";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// --- Standardized Parameter Interfaces ---
type IListJobProfileParams = IListParams<JobProfileInput>;
type IJobProfileQueryParams = ListQueryParams<JobProfileInput>;

export interface IJobProfileUpdateParams {
  query: IJobProfileQueryParams;
  payload: Partial<JobProfileInput> & { kycDocumentStorage?: AwsStorageTemplate };
}

export interface IJobProfileGetParams {
  query: IJobProfileQueryParams;
}

export interface IJobProfileCreateParams {
  payload: JobProfileInput & { kycDocumentStorage?: AwsStorageTemplate };
}
// -----------------------------------------

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

export const getOne = async ({ query = {} }: IJobProfileGetParams) => {
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

export const getOneSoftDeleted = async ({ query = {} }: IJobProfileGetParams) => {
  const jobProfiles = await JobProfile.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...jobProfileProjectQuery(),
  ]);
  if (jobProfiles.length === 0) throw new NotFoundException("Job Profile not found in trash.");
  return jobProfiles[0];
};

export const create = async ({ payload }: IJobProfileCreateParams) => {
  const jobProfileId = new Types.ObjectId();
  let kycDocumentId = null;
  if (payload.kycDocumentStorage) {
    const fileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.JOB_PROFILE,
        collectionDocument: jobProfileId,
        storageInformation: payload.kycDocumentStorage,
        visibility: VISIBILITY_ENUM.PRIVATE,
      },
    });
    kycDocumentId = fileMedia._id;
  }

  const { kycDocumentStorage, ...cleanPayload } = payload;

  let jobProfile = new JobProfile({
    ...cleanPayload,
    _id: jobProfileId,
    kycDocumentId: kycDocumentId,
  });

  jobProfile = await jobProfile.save();
  return jobProfile;
};

export const update = async ({ query, payload }: IJobProfileUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  const jobProfile = await getOne({ query: sanitizedQuery });
  let updatedKycDocumentId = jobProfile.kycDocumentId;

  if (payload.kycDocumentStorage) {
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.JOB_PROFILE,
        collectionDocument: jobProfile._id,
        storageInformation: payload.kycDocumentStorage,
        visibility: VISIBILITY_ENUM.PRIVATE,
      },
    });

    updatedKycDocumentId = newFileMedia._id;

    // Hard delete old KYC document to ensure it's removed from S3
    if (jobProfile.kycDocumentId) {
      try {
        await FileMediaService.hardDelete({ query: { _id: jobProfile.kycDocumentId.toString() } });
      } catch (error) {
        console.error(`Failed to delete old KYC doc for JobProfile ${jobProfile._id}`, error);
      }
    }
  }

  const { kycDocumentStorage, ...cleanPayload } = payload;

  const updatedJobProfile = await JobProfile.findOneAndUpdate(
    { _id: jobProfile._id },
    {
      $set: {
        ...cleanPayload,
        kycDocumentId: updatedKycDocumentId,
      },
    },
    { new: true }
  );

  if (!updatedJobProfile) throw new NotFoundException("Job Profile not found.");
  return updatedJobProfile;
};

export const softDelete = async ({ query }: IJobProfileGetParams) => {
  const { deleted } = await JobProfile.softDelete(sanitizeQueryIds(query));
  const jobProfile = await getOneSoftDeleted({ query: sanitizeQueryIds(query) });
  if (!deleted) throw new NotFoundException("Job Profile not found to delete.");
  return jobProfile;
};

export const hardDelete = async ({ query }: IJobProfileGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const jobProfile = await getOneSoftDeleted({ query: sanitizedQuery });

  // Delegate S3 deletion securely to FileMediaService
  if (jobProfile.kycDocumentId) {
    try {
      await FileMediaService.hardDelete({ query: { _id: jobProfile.kycDocumentId.toString() } });
    } catch (error) {
      console.error("Failed to delete attached KYC document for JobProfile:", error);
    }
  }

  const deletedJobProfile = await JobProfile.findOneAndDelete({ _id: jobProfile._id });
  if (!deletedJobProfile) throw new NotFoundException("Job Profile not found to delete.");
  return jobProfile;
};

export const restore = async ({ query }: IJobProfileGetParams) => {
  const { restored } = await JobProfile.restore(sanitizeQueryIds(query));
  const jobProfile = await getOne({ query: sanitizeQueryIds(query) });
  if (!restored) throw new NotFoundException("Job Profile not found in trash.");
  return jobProfile;
};
