import { Types } from "mongoose";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { cvProjectQuery } from "./cv.query";
import { NotFoundException } from "../../../common/helper";
import { CV, CVInput } from "../../../models/cv.model";
import { IListParams, ListQueryParams } from "@rl/types";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { VISIBILITY_ENUM } from "@rl/types";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// --- Standardized Parameter Interfaces ---
type IListCVParams = IListParams<CVInput>;
type ICVQueryParams = ListQueryParams<CVInput>;

export interface ICVUpdateParams {
  query: ICVQueryParams;
  payload: Partial<CVInput> & { imageStorage?: AwsStorageTemplate };
}

export interface ICVGetParams {
  query: ICVQueryParams;
}

export interface ICVCreateParams {
  payload: CVInput & { imageStorage?: AwsStorageTemplate };
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

  // 2. Intercept AWS storage data and create the FileMedia document
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

  const { imageStorage, ...cleanPayload } = payload;

  let cv = new CV({
    ...cleanPayload,
    _id: cvId,
    imageId: imageId,
  });

  cv = await cv.save();
  return cv;
};

export const update = async ({ query, payload }: ICVUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  const cv = await getOne({ query: sanitizedQuery });
  let updatedImageId = cv.imageId;

  // 2. If a new image is provided, swap it out
  if (payload.imageStorage) {
    // A. Create the new FileMedia document
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.CV,
        collectionDocument: cv._id,
        storageInformation: payload.imageStorage,
        visibility: VISIBILITY_ENUM.PUBLIC,
      },
    });

    updatedImageId = newFileMedia._id;

    // B. Delete the old image so it doesn't waste S3 space
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

  // 3. Strip raw AWS data
  const { imageStorage, ...cleanPayload } = payload;

  const updatedCV = await CV.findOneAndUpdate(
    { _id: cv._id },
    {
      $set: {
        ...cleanPayload,
        imageId: updatedImageId,
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
  if (cv.imageId) {
    try {
      await FileMediaService.hardDelete({
        query: { _id: cv.imageId.toString() },
      });
    } catch (error) {
      console.error("Failed to delete attached FileMedia for CV:", error);
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
