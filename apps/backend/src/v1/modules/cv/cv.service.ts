import { Types } from "mongoose";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { cvProjectQuery } from "./cv.query";
import { NotFoundException } from "../../../common/helper";
import { CV, CVInput } from "../../../models/cv.model";
import { CV_STATUS_ENUM, IListParams, ListQueryParams } from "@rl/types";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { VISIBILITY_ENUM } from "@rl/types";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// --- Standardized Parameter Interfaces ---
type IListCVParams = IListParams<CVInput>;
type ICVQueryParams = ListQueryParams<CVInput>;

export interface ICVUpdateParams {
  query: ICVQueryParams;
  payload: Partial<CVInput> & {
    imageStorage?: AwsStorageTemplate;
    resumeStorage?: AwsStorageTemplate; // Added resumeStorage
  };
}

export interface ICVGetParams {
  query: ICVQueryParams;
}

export interface ICVCreateParams {
  payload: CVInput & {
    imageStorage?: AwsStorageTemplate;
    resumeStorage?: AwsStorageTemplate; // Added resumeStorage
  };
}

export const list = ({ query = {}, options }: IListCVParams) => {
  return CV.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...cvProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: ICVGetParams) => {
  const cvs = await CV.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...cvProjectQuery(),
  ]);
  if (cvs.length === 0) throw new NotFoundException("CV not found.");
  return cvs[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListCVParams) => {
  const cvs = await CV.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...cvProjectQuery()],
    options
  );
  return cvs;
};

export const getOneSoftDeleted = async ({ query = {} }: ICVGetParams) => {
  const cvs = await CV.aggregate([...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...cvProjectQuery()]);
  if (cvs.length === 0) throw new NotFoundException("CV not found in trash.");
  return cvs[0];
};

export const create = async ({ payload }: ICVCreateParams) => {
  // 1. Pre-generate the CV ID
  const cvId = new Types.ObjectId();
  let imageId = null;
  let resumeId = null;

  if (payload.resumeStorage && !payload.status) {
    payload.status = CV_STATUS_ENUM.PUBLISHED;
  }

  // 2. Intercept AWS storage data and create the FileMedia document for Image
  if (payload.imageStorage) {
    const fileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.CV,
        collectionDocument: cvId,
        storageInformation: payload.imageStorage,
        visibility: VISIBILITY_ENUM.PUBLIC, // CV profile pictures should be public!
      },
    });
    imageId = fileMedia._id;
  }

  // 3. Intercept AWS storage data and create the FileMedia document for Resume
  if (payload.resumeStorage) {
    const fileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.CV,
        collectionDocument: cvId,
        storageInformation: payload.resumeStorage,
        visibility: VISIBILITY_ENUM.PRIVATE, // Resumes are typically private
      },
    });
    resumeId = fileMedia._id;
  }

  // 4. Strip raw AWS data from payload
  const { imageStorage, resumeStorage, ...cleanPayload } = payload;

  let cv = new CV({
    ...cleanPayload,
    _id: cvId,
    imageId: imageId,
    resumeId: resumeId,
  });

  cv = await cv.save();
  return cv;
};

export const update = async ({ query, payload }: ICVUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  const cv = await getOne({ query: sanitizedQuery });
  let updatedImageId = cv.imageId;
  let updatedResumeId = cv.resumeId;

  // 1. Handle Image Update
  if (payload.imageStorage) {
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.CV,
        collectionDocument: cv._id,
        storageInformation: payload.imageStorage,
        visibility: VISIBILITY_ENUM.PUBLIC,
      },
    });

    updatedImageId = newFileMedia._id;

    if (cv.imageId) {
      try {
        await FileMediaService.hardDelete({
          query: { _id: cv.imageId.toString() },
        });
      } catch (error) {
        console.error(`Failed to delete old image ${cv.imageId} for CV ${cv._id}`, error);
      }
    }
  }

  // 2. Handle Resume Update
  if (payload.resumeStorage) {
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.CV,
        collectionDocument: cv._id,
        storageInformation: payload.resumeStorage,
        visibility: VISIBILITY_ENUM.PRIVATE,
      },
    });

    updatedResumeId = newFileMedia._id;

    if (cv.resumeId) {
      try {
        await FileMediaService.hardDelete({
          query: { _id: cv.resumeId.toString() },
        });
      } catch (error) {
        console.error(`Failed to delete old resume ${cv.resumeId} for CV ${cv._id}`, error);
      }
    }
  }

  // 3. Strip raw AWS data
  const { imageStorage, resumeStorage, ...cleanPayload } = payload;

  const updatedCV = await CV.findOneAndUpdate(
    { _id: cv._id },
    {
      $set: {
        ...cleanPayload,
        imageId: updatedImageId,
        resumeId: updatedResumeId,
      },
    },
    { new: true }
  );

  if (!updatedCV) throw new NotFoundException("CV not found.");
  return updatedCV;
};

// Renamed from softRemove for consistency
export const softDelete = async ({ query }: ICVGetParams) => {
  const { deleted } = await CV.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("CV not found to delete.");
  const cv = await getOneSoftDeleted({ query: sanitizeQueryIds(query) });
  return { cv };
};

export const hardDelete = async ({ query }: ICVGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const cv = await getOneSoftDeleted({ query: sanitizedQuery });

  // Delegate S3 deletion to the FileMediaService
  const filesToDelete: Types.ObjectId[] = [];

  if (cv.imageId) filesToDelete.push(cv.imageId);
  if (cv.resumeId) filesToDelete.push(cv.resumeId);

  // Clean up all related files in S3 / FileMedia Service
  for (const fileId of filesToDelete) {
    try {
      await FileMediaService.hardDelete({
        query: { _id: fileId.toString() },
      });
    } catch (error) {
      console.error(`Failed to delete attached FileMedia ${fileId} for CV ${cv._id}:`, error);
    }
  }

  const deletedCV = await CV.findOneAndDelete({ _id: cv._id });
  if (!deletedCV) throw new NotFoundException("CV not found to delete.");
  return { cv: deletedCV };
};

export const restore = async ({ query }: ICVGetParams) => {
  const { restored } = await CV.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("CV not found in trash.");
  const cv = await getOne({ query: sanitizeQueryIds(query) });
  return { cv };
};
