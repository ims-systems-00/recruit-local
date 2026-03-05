import { IListParams, VISIBILITY_ENUM } from "@rl/types";
import { CertificationInput, Certification } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { certificationProjectionQuery } from "./certification.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import * as FileMediaService from "../file-media/file-media.service";
import { Types } from "mongoose";
import { modelNames } from "../../../models/constants";

type IListCertificationParams = IListParams<CertificationInput>;
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

export const list = ({ query = {}, options }: IListCertificationParams) => {
  return Certification.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...certificationProjectionQuery()],
    options
  );
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

export const listSoftDeleted = ({ query = {}, options }: IListCertificationParams) => {
  return Certification.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...certificationProjectionQuery()],
    options
  );
};

export const getSoftDeletedOne = async ({ query }: ICertificationGetParams) => {
  const certification = await Certification.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...certificationProjectionQuery(),
  ]);
  if (certification.length === 0) throw new NotFoundException("Certification not found in trash.");
  return certification[0];
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

  certification = await certification.save();

  return certification;
};

export const update = async ({ query, payload }: ICertificationUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const certification = await getOne({ query: sanitizedQuery });

  let updatedImageId = certification.imageId;

  if (payload.imageStorage) {
    const newFileMedia = await FileMediaService.create({
      payload: {
        collectionName: modelNames.CERTIFICATION,
        collectionDocument: certification._id,
        storageInformation: payload.imageStorage,
        visibility: VISIBILITY_ENUM.PUBLIC,
      },
    });

    updatedImageId = newFileMedia._id;

    if (certification.imageId) {
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
  }

  const { imageStorage, ...cleanPayload } = payload;

  const updatedCertification = await Certification.findOneAndUpdate(
    { _id: certification._id },
    {
      $set: {
        ...cleanPayload,
        imageId: updatedImageId,
      },
    },
    { new: true }
  );

  return updatedCertification;
};

export const softRemove = async ({ query }: ICertificationGetParams) => {
  const { deleted } = await Certification.softDelete(query);

  return { deleted };
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

  return await Certification.findOneAndDelete({ _id: certification._id });
};

export const restore = async ({ query }: ICertificationGetParams) => {
  const { restored } = await Certification.restore(query);
  if (!restored) throw new NotFoundException("Certification not found in trash.");

  return { restored };
};
