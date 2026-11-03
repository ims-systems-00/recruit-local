import { IListParams, VISIBILITY_ENUM } from "@rl/types";
import { CertificationInput, Certification, FileMedia } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { certificationProjectionQuery } from "./certification.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { enqueueProfileCompletion } from "../../../queue/profileCompletionUpdateQueue";
import * as FileMediaService from "../file-media/file-media.service";
import { Types } from "mongoose";
import { modelNames } from "../../../models/constants";

type IListCertificationParams = IListParams<CertificationInput> & { offset?: number };
type ICertificationQueryParams = Partial<CertificationInput & { _id: string }>;

export interface ICertificationUpdateParams {
  query: ICertificationQueryParams;
  payload: Partial<CertificationInput> & { imageStorage?: AwsStorageTemplate };
}

export interface ICertificationGetParams {
  query: ICertificationQueryParams;
}

export interface ICertificationCreateParams {
  payload: CertificationInput & { imageStorage?: AwsStorageTemplate };
}

export const list = async ({ query = {}, options, offset = 0 }: IListCertificationParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Certification.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...certificationProjectionQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

export const getOne = async ({ query }: ICertificationGetParams) => {
  const certification = await Certification.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...certificationProjectionQuery(),
  ]);
  if (certification.length === 0) throw new NotFoundException("Certification not found.");
  return certification[0];
};

export const listSoftDeleted = async ({ query = {}, options, offset = 0 }: IListCertificationParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Certification.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...certificationProjectionQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

export const getSoftDeletedOne = async ({ query }: ICertificationGetParams) => {
  const certification = await Certification.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...certificationProjectionQuery(),
  ]);
  if (certification.length === 0) throw new NotFoundException("Certification not found in trash.");
  return certification[0];
};

/**
 * Undoes the image record made for a write that then failed, so no record is
 * left pointing at a certification that was never saved. Only the record: the
 * uploaded file stays for a retry — `FileMediaService.hardDelete` would delete
 * the file too.
 */
const discardImageRecord = async (imageId: Types.ObjectId | null) => {
  if (!imageId) return;
  try {
    await FileMedia.deleteOne({ _id: imageId });
  } catch (error) {
    console.error(`Failed to discard image record ${imageId}`, error);
  }
};

export const create = async ({ payload }: ICertificationCreateParams) => {
  const certificationId = new Types.ObjectId();
  let imageId = null;

  if (payload.imageStorage) {
    const fileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.CERTIFICATION,
        collectionDocument: certificationId,
        storageInformation: payload.imageStorage,
        visibility: VISIBILITY_ENUM.PUBLIC,
      },
    });
    imageId = fileMedia._id;
  }

  // 3. Strip raw AWS data and save the clean payload
  const { imageStorage, ...cleanPayload } = payload;

  let certification = new Certification({
    ...cleanPayload,
    _id: certificationId,
    imageId: imageId,
  });

  try {
    certification = await certification.save();
  } catch (error) {
    await discardImageRecord(imageId);
    throw error;
  }

  await enqueueProfileCompletion(certification.userId);
  return certification;
};

export const update = async ({ query, payload }: ICertificationUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const certification = await getOne({ query: sanitizedQuery });

  let updatedImageId = certification.imageId;
  let newImageId: Types.ObjectId | null = null;

  if (payload.imageStorage) {
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.CERTIFICATION,
        collectionDocument: certification._id,
        storageInformation: payload.imageStorage,
        visibility: VISIBILITY_ENUM.PUBLIC,
      },
    });

    newImageId = newFileMedia._id as Types.ObjectId;
    updatedImageId = newImageId;
  }

  const { imageStorage, ...cleanPayload } = payload;

  let updatedCertification;
  try {
    updatedCertification = await Certification.findOneAndUpdate(
      { _id: certification._id },
      {
        $set: {
          ...cleanPayload,
          imageId: updatedImageId,
        },
      },
      { new: true }
    );
  } catch (error) {
    await discardImageRecord(newImageId);
    throw error;
  }

  // Only once the certification points at the new image is the old one safe to
  // delete — deleted before the save, a failed save would leave it pointing at
  // a missing file.
  if (newImageId && certification.imageId) {
    try {
      await FileMediaService.hardDelete({
        query: { _id: certification.imageId.toString() },
      });
    } catch (error) {
      console.error(
        `Failed to delete old image ${certification.imageId} for Certification ${certification._id}`,
        error
      );
    }
  }

  await enqueueProfileCompletion(updatedCertification?.userId);
  return updatedCertification;
};

export const softRemove = async ({ query }: ICertificationGetParams) => {
  const { deleted } = await Certification.softDelete(query);
  const result = await getSoftDeletedOne({ query });
  await enqueueProfileCompletion(result?.userId);
  return result;
};

export const hardDelete = async ({ query }: ICertificationGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const certification = await getSoftDeletedOne({ query: sanitizedQuery });

  if (certification.imageId) {
    try {
      await FileMediaService.hardDelete({
        query: { _id: certification.imageId.toString() },
      });
    } catch (error) {
      console.error("Failed to delete attached FileMedia:", error);
    }
  }

  const deletedCertification = await Certification.findOneAndDelete({ _id: certification._id });
  if (!deletedCertification) throw new NotFoundException("Certification not found to delete.");
  await enqueueProfileCompletion(certification?.userId);
  return certification;
};

export const restore = async ({ query }: ICertificationGetParams) => {
  const { restored } = await Certification.restore(query);
  if (!restored) throw new NotFoundException("Certification not found in trash.");
  const result = await getOne({ query });
  await enqueueProfileCompletion(result?.userId);
  return result;
};
