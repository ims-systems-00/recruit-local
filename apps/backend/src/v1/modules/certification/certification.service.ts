import { IListParams } from "@rl/types";
import { CertificationInput, Certification, ICertificationDoc } from "../../../models";
import { FileManager, NotFoundException } from "../../../common/helper";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { s3Client } from "../../../.config/s3.config";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { certificationProjectionQuery } from "./certification.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";

type IListCertificationParams = IListParams<CertificationInput>;
type IGetOneCertificationParams = Partial<ICertificationDoc>;

type CreatePayload = CertificationInput & AwsStorageTemplate;

export const list = ({ query = {}, options }: IListCertificationParams) => {
  return Certification.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...certificationProjectionQuery()],
    options
  );
};

export const getOne = async (query: IGetOneCertificationParams) => {
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

export const getSoftDeletedOne = async (query: IGetOneCertificationParams) => {
  const certification = await Certification.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...certificationProjectionQuery(),
  ]);
  if (certification.length === 0) throw new NotFoundException("Certification not found in trash.");
  return certification[0];
};

export const create = async (payload: CreatePayload) => {
  let certification: ICertificationDoc;
  if (payload.Key) {
    const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL?.replace(/\/$/, "");
    const src = `${baseUrl}/${payload.Key}`;
    certification = new Certification({
      ...payload,
      imageSrc: src,
      imageStorage: {
        Bucket: payload.Bucket,
        Key: payload.Key,
        Name: payload.Name,
      },
    });
  } else {
    certification = new Certification({ ...payload });
  }

  certification = await certification.save();

  return certification;
};

export const update = async (
  query: IGetOneCertificationParams,
  payload: Partial<CertificationInput> & AwsStorageTemplate
) => {
  const certification = await getOne(query);
  const existingImageStorage = certification.imageStorage;

  const { Key, Bucket, Name, ...fieldsToUpdate } = payload;

  const fileManager = new FileManager(s3Client);
  // If new image is provided, delete the old one from S3
  if (Key && existingImageStorage) {
    await fileManager.deleteFile({ Bucket: existingImageStorage.Bucket, Key: existingImageStorage.Key });
  }

  // If new image is provided, update the imageSrc
  if (Key) {
    const src = process.env.PUBLIC_MEDIA_BASE_URL + "/" + Key;
    fieldsToUpdate.imageSrc = src;
    fieldsToUpdate.imageStorage = {
      Bucket: Bucket,
      Key: Key,
      Name: Name,
    };
  }
  const updatedCertification = await Certification.findOneAndUpdate(
    { _id: certification._id },
    { $set: fieldsToUpdate },
    { new: true }
  );

  return updatedCertification;
};

export const softRemove = async (query: IGetOneCertificationParams) => {
  const { deleted } = await Certification.softDelete(query);

  return { deleted };
};

export const hardRemove = async (id: string) => {
  const certification = await getOne({ _id: id });
  // 2. If it exists and has a key, delete from S3
  if (certification?.imageStorage?.Key) {
    const fileManager = new FileManager(s3Client);
    // Wrap in try/catch so DB deletion happens even if S3 fails
    try {
      await fileManager.deleteFile({
        Bucket: certification.imageStorage.Bucket,
        Key: certification.imageStorage.Key,
      });
    } catch (error) {
      console.error("Failed to delete file from S3:", error);
    }
  }
  return await Certification.findOneAndDelete({ _id: id });
};

export const restore = async (query: IGetOneCertificationParams) => {
  const { restored } = await Certification.restore(query);
  if (!restored) throw new NotFoundException("Certification not found in trash.");

  return { restored };
};
