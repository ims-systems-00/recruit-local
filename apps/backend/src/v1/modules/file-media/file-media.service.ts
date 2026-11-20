import { Types } from "mongoose";
import { IListParams, VISIBILITY_ENUM } from "@rl/types";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { NotFoundException, logger, sanitizeQueryIds } from "../../../common/helper";
import { fileMediaProjectionQuery, fileMediaSrcQuery } from "./file-media.query";
import { FileMedia, IFileMediaInput } from "../../../models";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { ModelNames } from "../../../models/constants";
import { thumbnailCreateQueue } from "../../../queue/thumbnailCreateQueue";
import { fileDeleteQueue } from "../../../queue/fileDeleteQueue";

type IFileMediaListParams = IListParams<IFileMediaInput> & { offset?: number };
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

  try {
    await thumbnailCreateQueue.addJob("create-thumbnail", {
      fileMediaId: fileMedia.id.toString(),
    });
  } catch (error) {
    logger.error("Failed to enqueue thumbnail create job", error);
  }

  return fileMedia;
};

export const list = async ({ query = {}, options, offset = 0 }: IFileMediaListParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const aggregate = FileMedia.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...fileMediaProjectionQuery(),
    ...fileMediaSrcQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(await aggregate, limit);
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

export const isSameStoredFile = async (fileMediaId: string, storage: AwsStorageTemplate): Promise<boolean> => {
  try {
    const { storageInformation } = await getOne({ query: { _id: fileMediaId } });
    return storageInformation?.Bucket === storage.Bucket && storageInformation?.Key === storage.Key;
  } catch (error) {
    if (error instanceof NotFoundException) return false;
    throw error;
  }
};

export const isNewFile = async (storage: AwsStorageTemplate, currentId?: Types.ObjectId | string | null) =>
  !currentId || !(await isSameStoredFile(currentId.toString(), storage));

export interface IResolveFileRefsParams<S, K extends string> {
  collectionName: ModelNames;
  collectionDocument: Types.ObjectId;
  visibility: VISIBILITY_ENUM;
  fields: { storageKey: keyof S; idKey: K }[];
  payload: S;
  existing?: Partial<Record<K, Types.ObjectId | null>>;
}

// turns upload templates into FileMedia ids, replacing old files
export const resolveFileRefs = async <S extends { [P in keyof S]?: AwsStorageTemplate | null }, K extends string>({
  collectionName,
  collectionDocument,
  visibility,
  fields,
  payload,
  existing,
}: IResolveFileRefsParams<S, K>): Promise<Partial<Record<K, Types.ObjectId | null>>> => {
  const ids: Partial<Record<K, Types.ObjectId | null>> = {};

  for (const { storageKey, idKey } of fields) {
    const storage = payload[storageKey];
    if (storage === undefined) continue;

    const previousId = existing?.[idKey];
    if (storage && !(await isNewFile(storage, previousId))) continue;

    let newId: Types.ObjectId | null = null;
    if (storage) {
      const fileMedia = await create({
        payload: { collectionName, collectionDocument, storageInformation: storage, visibility },
      });
      newId = fileMedia._id as Types.ObjectId;
    }
    ids[idKey] = newId;

    if (previousId) {
      try {
        await hardDelete({ query: { _id: previousId.toString() } });
      } catch (error) {
        logger.error(`Failed to delete old ${idKey} for ${collectionName} ${collectionDocument}`, error);
      }
    }
  }

  return ids;
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
  const fileMedia = await getOne({ query });
  await FileMedia.findOneAndDelete(sanitizeQueryIds(query));

  const { Bucket, Key } = fileMedia.storageInformation;
  const filesToDelete: { Bucket: string; Key: string }[] = [{ Bucket, Key }];

  if (fileMedia.thumbnail?.Bucket && fileMedia.thumbnail?.Key) {
    const isSameAsPrimary = fileMedia.thumbnail.Bucket === Bucket && fileMedia.thumbnail.Key === Key;
    if (!isSameAsPrimary) {
      filesToDelete.push({ Bucket: fileMedia.thumbnail.Bucket, Key: fileMedia.thumbnail.Key });
    }
  }

  try {
    await fileDeleteQueue.addJob("delete-file-media-assets", {
      files: filesToDelete,
    });
  } catch (error) {
    logger.error("Failed to enqueue file delete job", error);
  }

  return fileMedia;
};
