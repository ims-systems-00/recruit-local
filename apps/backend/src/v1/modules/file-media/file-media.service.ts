import { IListParams } from "@rl/types";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { NotFoundException, FileManager, sanitizeQueryIds } from "../../../common/helper";
import { fileMediaProjectionQuery, fileMediaSrcQuery } from "./file-media.query";
import { FileMedia, IFileMediaInput } from "../../../models";
import { s3Client } from "../../../.config/s3.config";

type IFileMediaListParams = IListParams<IFileMediaInput>;
type IFileMediaQueryParams = Partial<IFileMediaInput & { _id: string }>;

export interface IFileMediaUpdateParams {
  query: IFileMediaQueryParams;
  payload: Partial<IFileMediaInput>;
}

export interface IFileMediaGetParams {
  query: IFileMediaQueryParams;
}

export interface IFileMediaCreateParams {
  payload: IFileMediaInput;
}

export const create = async ({ payload }: IFileMediaCreateParams) => {
  let fileMedia = new FileMedia(payload);
  fileMedia = await fileMedia.save();

  return fileMedia;
};

export const list = ({ query = {}, options }: IFileMediaListParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  return FileMedia.aggregatePaginate(
    [...matchQuery(sanitizedQuery), ...excludeDeletedQuery(), ...fileMediaProjectionQuery(), ...fileMediaSrcQuery()],
    options
  );
};

export const listSoftDeleted = async ({ query = {} }: Partial<IFileMediaGetParams> = {}) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const fileMedias = await FileMedia.aggregate([
    ...matchQuery(sanitizedQuery),
    ...onlyDeletedQuery(),
    ...fileMediaProjectionQuery(),
    ...fileMediaSrcQuery(),
  ]);
  return fileMedias;
};

export const getOne = async ({ query }: IFileMediaGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const fileMedias = await FileMedia.aggregate([
    ...matchQuery(sanitizedQuery),
    ...excludeDeletedQuery(),
    ...fileMediaProjectionQuery(),
    ...fileMediaSrcQuery(),
  ]);
  if (fileMedias.length === 0) throw new NotFoundException("File and media not found.");
  return fileMedias[0];
};

export const getOneSoftDeleted = async ({ query }: IFileMediaGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const fileMedias = await FileMedia.aggregate([
    ...matchQuery(sanitizedQuery),
    ...onlyDeletedQuery(),
    ...fileMediaProjectionQuery(),
    ...fileMediaSrcQuery(),
  ]);
  if (fileMedias.length === 0) throw new NotFoundException("File and media not found in trash.");
  return fileMedias[0];
};

export const update = async ({ query, payload }: IFileMediaUpdateParams) => {
  const fileMedia = await getOne({ query: sanitizeQueryIds(query) });

  const updatedFileMedia = await FileMedia.findOneAndUpdate(
    { _id: fileMedia._id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedFileMedia;
};

export const softDelete = async ({ query }: IFileMediaGetParams) => {
  const fileMedia = await FileMedia.softDelete(sanitizeQueryIds(query));
  if (!fileMedia.deleted) throw new NotFoundException("File and media not found to delete.");
  const deletedFileMedia = await getOneSoftDeleted({ query });
  return deletedFileMedia;
};

export const restore = async ({ query }: IFileMediaGetParams) => {
  await FileMedia.restore(sanitizeQueryIds(query));
  const restoredFileMedia = await getOne({ query });
  return restoredFileMedia;
};

export const hardDelete = async ({ query }: IFileMediaGetParams) => {
  const fileMedia = await getOneSoftDeleted({ query });
  await FileMedia.findOneAndDelete(sanitizeQueryIds(query));

  // todo: delete from s3. - probably moves this to a queue?
  const fileManager = new FileManager(s3Client);
  const { Bucket, Key } = fileMedia.storageInformation;
  fileManager.deleteFile({ Bucket, Key });

  return fileMedia;
};
