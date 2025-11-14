import { S3Client } from "@aws-sdk/client-s3";
import { NotFoundException, FileManager } from "../../../common/helper";
import { IListFileMediaParams } from "./file-media.interface";
import { FileMedia, FileMediaInput } from "../../../models";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
  },
  region: "eu-west-2",
});

const populates = [
  {
    path: "collectionDocument",
    select: "name type parentId storageInformation ownedBy",
  },
];

export const listFileMedia = ({ query = {}, options }: IListFileMediaParams) => {
  return FileMedia.paginateAndExcludeDeleted(query, { ...options, populate: populates });
};

export const getFileMedia = async (id: string) => {
  const fileMedia = await FileMedia.findOneWithExcludeDeleted({ _id: id });
  if (!fileMedia) throw new NotFoundException("File and media not found.");

  return fileMedia.populate(populates);
};

export const updateFileMedia = async (id: string, payload: Partial<FileMediaInput>) => {
  await getFileMedia(id);
  const updatedFileMedia = await FileMedia.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedFileMedia.populate(populates);
};

export const createFileMedia = async (payload: FileMediaInput) => {
  let fileMedia = new FileMedia(payload);
  fileMedia = await fileMedia.save();

  return fileMedia.populate(populates);
};

export const softRemoveFileMedia = async (id: string) => {
  const fileMedia = await getFileMedia(id);
  const { deleted } = await FileMedia.softDelete({ _id: id });

  return { fileMedia, deleted };
};

export const hardRemoveFileMedia = async (id: string) => {
  const fileMedia = await FileMedia.findOneWithExcludeDeleted({ _id: id });
  if (!fileMedia) return null;
  await FileMedia.findOneAndDelete({ _id: id });

  const fileManager = new FileManager(s3Client);
  const { storageInformation } = fileMedia;
  fileManager.deleteFile({ Bucket: storageInformation.Bucket, Key: storageInformation.Key });

  return fileMedia;
};

export const restoreFileMedia = async (id: string) => {
  const { restored } = await FileMedia.restore({ _id: id });
  if (!restored) throw new NotFoundException("File and media not found in trash.");

  const fileMedia = await getFileMedia(id);

  return { fileMedia, restored };
};
