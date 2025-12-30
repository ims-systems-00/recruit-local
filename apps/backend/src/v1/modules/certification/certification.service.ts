import { IListParams } from "@inrm/types";
import { CertificationInput, Certification, ICertificationDoc } from "../../../models";
import { FileManager, NotFoundException } from "../../../common/helper";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { s3Client } from "../../../.config/s3.config";

type IListCertificationParams = IListParams<CertificationInput>;

type CreatePayload = CertificationInput & AwsStorageTemplate;

export const list = ({ query = {}, options }: IListCertificationParams) => {
  return Certification.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const certification = await Certification.findOneWithExcludeDeleted({ _id: id });
  if (!certification) throw new NotFoundException("Certification not found.");
  return certification;
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
  const certification = await getOne(id);
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
  const certification = await getOne(id);
  const { deleted } = await Certification.softDelete({ _id: id });

  return { certification, deleted };
};

export const hardRemove = async (id: string) => {
  const certification = await getOne(id);
  await Certification.findOneAndDelete({ _id: id });

  return certification;
};

export const restore = async (id: string) => {
  const { restored } = await Certification.restore({ _id: id });
  if (!restored) throw new NotFoundException("Certification not found in trash.");

  const certification = await getOne(id);

  return { certification, restored };
};
