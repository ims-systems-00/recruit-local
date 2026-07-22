import { Types } from "mongoose";
import { VISIBILITY_ENUM } from "@rl/types";
import { JobProfile, JobTitle, Industry, WorkMode, ExperienceLevel } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  populateNamedRefQuery,
  populateSingleNamedRefQuery,
  populateFileMediaQuery,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { jobProfileProjectQuery } from "./job-profile.query";
import { recomputeProfileCompletion } from "./profile-completion.service";
import { populateValuesQuery } from "../value/value.query";
import * as FileMediaService from "../file-media/file-media.service";
import { valueWeightUpdateQueue } from "../../../queue/valueWeightUpdateQueue";
import { enqueueProfileKeywords } from "../../../queue/keywordUpdateQueue";
import { modelNames } from "../../../models/constants";
import {
  IJobProfileCreateParams,
  IJobProfileGetParams,
  IJobProfileUpdateParams,
  IJobProfilePhotoStorage,
  IListJobProfileParams,
} from "./job-profile.interface";

// Photo fields uploaded as an inline `*Storage` template and persisted as a
// FileMedia ObjectId reference.
const PHOTO_STORAGE_FIELDS: {
  storageKey: keyof IJobProfilePhotoStorage;
  idKey: "profileImageId" | "coverPhotoId";
}[] = [
  { storageKey: "profileImageStorage", idKey: "profileImageId" },
  { storageKey: "coverPhotoStorage", idKey: "coverPhotoId" },
];

/**
 * Resolves any inline photo upload templates on a write payload into FileMedia
 * documents: for each provided `*Storage`, creates a public FileMedia (or clears
 * the ref when `null`), hard-deletes the FileMedia it replaces, and returns a map
 * of `{ profileImageId?, coverPhotoId? }` to merge into the persisted document.
 * Only fields actually present on the payload are touched.
 */
const resolvePhotoStorage = async (
  jobProfileId: Types.ObjectId,
  payload: IJobProfilePhotoStorage,
  existing?: { profileImageId?: Types.ObjectId; coverPhotoId?: Types.ObjectId }
): Promise<Partial<Record<"profileImageId" | "coverPhotoId", Types.ObjectId | null>>> => {
  const ids: Partial<Record<"profileImageId" | "coverPhotoId", Types.ObjectId | null>> = {};

  for (const { storageKey, idKey } of PHOTO_STORAGE_FIELDS) {
    const storage = payload[storageKey];
    if (storage === undefined) continue; // field not part of this write

    let newId: Types.ObjectId | null = null;
    if (storage) {
      const fileMedia = await FileMediaService.create({
        payload: {
          collectionName: modelNames.JOB_PROFILE,
          collectionDocument: jobProfileId,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
      });
      newId = fileMedia._id as Types.ObjectId;
    }
    ids[idKey] = newId;

    // Remove the FileMedia this write replaces (non-fatal on error).
    const previousId = existing?.[idKey];
    if (previousId) {
      try {
        await FileMediaService.hardDelete({ query: { _id: previousId.toString() } });
      } catch (error) {
        console.error(`Failed to delete old ${idKey} for JobProfile ${jobProfileId}`, error);
      }
    }
  }

  return ids;
};

export const list = ({ query = {}, options, allowedFields }: IListJobProfileParams) => {
  return JobProfile.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...excludeDeletedQuery(),
      ...populateValuesQuery(),
      ...populateNamedRefQuery(JobTitle, "jobTitle"),
      ...populateNamedRefQuery(Industry, "industry"),
      ...populateNamedRefQuery(WorkMode, "workMode"),
      ...populateSingleNamedRefQuery(ExperienceLevel, "experienceLevel"),
      ...populateFileMediaQuery("profileImageId", "profileImage"),
      ...populateFileMediaQuery("coverPhotoId", "coverPhoto"),
      ...jobProfileProjectQuery(allowedFields),
    ],
    options
  );
};

export const getOne = async ({ query = {}, allowedFields }: IJobProfileGetParams) => {
  const jobProfiles = await JobProfile.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateValuesQuery(),
    ...populateNamedRefQuery(JobTitle, "jobTitle"),
    ...populateNamedRefQuery(Industry, "industry"),
    ...populateNamedRefQuery(WorkMode, "workMode"),
    ...populateSingleNamedRefQuery(ExperienceLevel, "experienceLevel"),
    ...populateFileMediaQuery("profileImageId", "profileImage"),
    ...populateFileMediaQuery("coverPhotoId", "coverPhoto"),
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

  const photoIds = await resolvePhotoStorage(jobProfileId, payload);

  const { kycDocumentStorage, profileImageStorage, coverPhotoStorage, ...cleanPayload } = payload;

  const jobProfile = new JobProfile({
    ...cleanPayload,
    _id: jobProfileId,
    kycDocumentId: kycDocumentId,
    ...photoIds,
  });

  await jobProfile.save();

  // Bump the weight of every value attached to the job profile.
  if (payload.values?.length) {
    const valueIds = payload.values.map((id) => id.toString());
    await valueWeightUpdateQueue.addJob("value-weight-update", { valueIds });
  }

  // Compute the initial completion from the freshly-created profile.
  await recomputeProfileCompletion(jobProfile.userId);

  // Rebuild match keywords off the request path.
  await enqueueProfileKeywords(jobProfileId);

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

  const photoIds = await resolvePhotoStorage(jobProfile._id, payload, jobProfile);

  const { kycDocumentStorage, profileImageStorage, coverPhotoStorage, ...cleanPayload } = payload;

  const updatedJobProfile = await JobProfile.findOneAndUpdate(
    { _id: jobProfile._id },
    {
      $set: {
        ...cleanPayload,
        kycDocumentId: updatedKycDocumentId,
        ...photoIds,
      },
    },
    {
      new: true,
      select: allowedFields, // Mongoose native projection
    }
  );

  if (!updatedJobProfile) throw new NotFoundException("Job Profile not found.");

  // Bump the weight of values newly attached to the job profile.
  if (payload.values?.length) {
    const existingValueIds = new Set<string>((jobProfile.values ?? []).map((id: Types.ObjectId) => id.toString()));
    const newValueIds = payload.values.map((id) => id.toString()).filter((id) => !existingValueIds.has(id));
    if (newValueIds.length) await valueWeightUpdateQueue.addJob("value-weight-update", { valueIds: newValueIds });
  }

  // Profile fields changed — recompute completion and return the fresh document.
  await recomputeProfileCompletion(jobProfile.userId);

  // Rebuild match keywords off the request path.
  await enqueueProfileKeywords(jobProfile._id);

  return getOne({ query: { _id: jobProfile._id } as any, allowedFields });
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
