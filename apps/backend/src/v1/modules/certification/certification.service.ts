import { IListParams } from "@rl/types";
import { CertificationInput, Certification, ICertificationDoc } from "../../../models";
import { FileManager, NotFoundException } from "../../../common/helper";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { s3Client } from "../../../.config/s3.config";
import { matchQuery, excludeDeletedQuery } from "../../../common/query";
import { certificationProjectionQuery } from "./certification.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";

type IListCertificationParams = IListParams<CertificationInput>;
type IGetOneCertificationParams = Partial<ICertificationDoc>;

type CreatePayload = CertificationInput & AwsStorageTemplate;

export const list = ({ query = {}, options }: IListCertificationParams) => {
  return Certification.aggregatePaginate(
    [...matchQuery(query), ...excludeDeletedQuery(), ...certificationProjectionQuery()],
    options
  );
};

export const getOne = async (query: IGetOneCertificationParams) => {
  const certification = await Certification.aggregate([
    ...matchQuery(query),
    ...excludeDeletedQuery(),
    ...certificationProjectionQuery(),
  ]);
  if (certification.length === 0) throw new NotFoundException("Certification not found.");
  return certification[0];
};

export const listSoftDeleted = ({ query = {}, options }: IListCertificationParams) => {
  return Certification.aggregatePaginate([...matchQuery(query), ...certificationProjectionQuery()], options);
};

export const getSoftDeletedOne = async (id: string) => {
  const certification = await Certification.aggregate([...matchQuery({ _id: id }), ...certificationProjectionQuery()]);
  if (certification.length === 0) throw new NotFoundException("Certification not found in trash.");
  return certification[0];
};

export const create = async (payload: CreatePayload) => {
  const src = process.env.PUBLIC_MEDIA_BASE_URL + "/" + payload.Key;

  let certification = new Certification({
    ...payload,
    imageSrc: src,
    imageStorage: {
      Bucket: payload.Bucket,
      Key: payload.Key,
      Name: payload.Name,
    },
  });
  certification = await certification.save();

  return certification;
};

export const update = async (id: string, payload: Partial<CertificationInput> & AwsStorageTemplate) => {
  const certification = await getOne(sanitizeQueryIds({ _id: id }));
  const existingImageStorage = certification.imageStorage;

  const fileManager = new FileManager(s3Client);
  // If new image is provided, delete the old one from S3
  if (payload.Key && existingImageStorage) {
    await fileManager.deleteFile({ Bucket: existingImageStorage.Bucket, Key: existingImageStorage.Key });
  }

  // If new image is provided, update the imageSrc
  const updatedFields: Partial<ICertificationDoc> = { ...payload };
  if (payload.Key) {
    const src = process.env.PUBLIC_MEDIA_BASE_URL + "/" + payload.Key;
    updatedFields.imageSrc = src;
    updatedFields.imageStorage = {
      Bucket: payload.Bucket,
      Key: payload.Key,
      Name: payload.Name,
    };
  }

  const updatedCertification = await Certification.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...updatedFields },
    },
    { new: true }
  );

  return updatedCertification;
};

export const softRemove = async (id: string) => {
  const { deleted } = await Certification.softDelete({ _id: id });

  return { deleted };
};

export const hardRemove = async (id: string) => {
  return await Certification.findOneAndDelete({ _id: id });
};

export const restore = async (id: string) => {
  const { restored } = await Certification.restore({ _id: id });
  if (!restored) throw new NotFoundException("Certification not found in trash.");

  return { restored };
};
