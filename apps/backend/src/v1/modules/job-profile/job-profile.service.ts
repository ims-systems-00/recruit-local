import { Types } from "mongoose";
import { VISIBILITY_ENUM } from "@rl/types";
import { JobProfile } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { jobProfileProjectQuery } from "./job-profile.query";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import {
  IJobProfileCreateParams,
  IJobProfileGetParams,
  IJobProfileUpdateParams,
  IListJobProfileParams,
} from "./job-profile.interface";

export const list = ({ query = {}, options, allowedFields }: IListJobProfileParams) => {
  return JobProfile.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...jobProfileProjectQuery(allowedFields)],
    options
  );
};

export const getOne = async ({ query = {}, allowedFields }: IJobProfileGetParams) => {
  const jobProfiles = await JobProfile.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...jobProfileProjectQuery(allowedFields),
  ]);
  if (jobProfiles.length === 0) throw new NotFoundException("Job Profile not found.");
  return jobProfiles[0];
};

export const listSoftDeleted = async ({ query = {}, options, allowedFields }: IListJobProfileParams) => {
  return JobProfile.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...jobProfileProjectQuery(allowedFields)],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {}, allowedFields }: IJobProfileGetParams) => {
  const jobProfiles = await JobProfile.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...jobProfileProjectQuery(allowedFields),
  ]);
  if (jobProfiles.length === 0) throw new NotFoundException("Job Profile not found in trash.");
  return jobProfiles[0];
};

export const create = async ({ payload, allowedFields }: IJobProfileCreateParams) => {
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

  const jobProfile = new JobProfile({
    ...cleanPayload,
    _id: jobProfileId,
    kycDocumentId: kycDocumentId,
  });

  await jobProfile.save();

  return getOne({
    query: { _id: jobProfileId } as any,
    allowedFields,
  });
};

export const update = async ({ query, payload, allowedFields }: IJobProfileUpdateParams) => {
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
    {
      new: true,
      select: allowedFields, // Mongoose native projection
    }
  );

  if (!updatedJobProfile) throw new NotFoundException("Job Profile not found.");
  return updatedJobProfile;
};

export const softDelete = async ({ query, allowedFields }: IJobProfileGetParams) => {
  const { deleted } = await JobProfile.softDelete(sanitizeQueryIds(query));

  // Return sanitized document using allowedFields
  const jobProfile = await getOneSoftDeleted({ query: sanitizeQueryIds(query), allowedFields });
  if (!deleted) throw new NotFoundException("Job Profile not found to delete.");
  return jobProfile;
};

export const hardDelete = async ({ query, allowedFields }: IJobProfileGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  // Fetch sanitized document before deleting it
  const jobProfile = await getOneSoftDeleted({ query: sanitizedQuery, allowedFields });

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

export const restore = async ({ query, allowedFields }: IJobProfileGetParams) => {
  const { restored } = await JobProfile.restore(sanitizeQueryIds(query));

  // Return sanitized document using allowedFields
  const jobProfile = await getOne({ query: sanitizeQueryIds(query), allowedFields });
  if (!restored) throw new NotFoundException("Job Profile not found in trash.");
  return jobProfile;
};
