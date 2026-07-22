import { Types } from "mongoose";
import { IListParams, ListQueryParams, VISIBILITY_ENUM, POST_TYPE_ENUMS } from "@rl/types";
import { Post, IPostInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { postProjectQuery } from "./post.query";
import { enqueuePostKeywords } from "../../../queue/keywordUpdateQueue";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// Transient upload templates accepted on writes: the service turns each into a
// public FileMedia document, stores the resulting id in `banner` / `images`,
// then strips these keys before persisting the post. Mirrors the job-profile
// image upload technique.
interface IPostStorage {
  bannerStorage?: AwsStorageTemplate | null;
  imagesStorage?: AwsStorageTemplate[];
}

// --- Standardized Parameter Interfaces ---
type IListPostParams = IListParams<IPostInput>;
type IPostQueryParams = ListQueryParams<IPostInput>;

export interface IPostUpdateParams {
  query: IPostQueryParams;
  payload: Partial<IPostInput> & IPostStorage;
}

export interface IPostGetParams {
  query: IPostQueryParams;
}

export interface IPostCreateParams {
  payload: IPostInput & IPostStorage;
}

// Create a public FileMedia from an inline AWS upload template.
const createPostMedia = (postId: Types.ObjectId, storage: AwsStorageTemplate) =>
  FileMediaService.create({
    payload: {
      collectionName: modelNames.POST,
      collectionDocument: postId,
      storageInformation: storage,
      visibility: VISIBILITY_ENUM.PUBLIC,
    },
  });

// Hard-delete a FileMedia this write replaces (non-fatal on error).
const safeDeleteMedia = async (id: Types.ObjectId) => {
  try {
    await FileMediaService.hardDelete({ query: { _id: id.toString() } });
  } catch (error) {
    console.error(`Failed to delete FileMedia ${id} for post`, error);
  }
};

export const list = ({ query = {}, options }: IListPostParams) => {
  return Post.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...postProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IPostGetParams) => {
  const posts = await Post.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...postProjectQuery(),
  ]);
  if (posts.length === 0) throw new NotFoundException("Post not found.");
  return posts[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListPostParams) => {
  return Post.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...postProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IPostGetParams) => {
  const posts = await Post.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...postProjectQuery(),
  ]);
  if (posts.length === 0) throw new NotFoundException("Post not found in trash.");
  return posts[0];
};

export const create = async ({ payload }: IPostCreateParams) => {
  const postId = new Types.ObjectId();

  let banner: Types.ObjectId | undefined;
  if (payload.bannerStorage) {
    const media = await createPostMedia(postId, payload.bannerStorage);
    banner = media._id as Types.ObjectId;
  }

  let images: Types.ObjectId[] = [];
  if (payload.imagesStorage?.length) {
    const created = await Promise.all(payload.imagesStorage.map((storage) => createPostMedia(postId, storage)));
    images = created.map((file) => file._id as Types.ObjectId);
  }

  const { bannerStorage, imagesStorage, ...cleanPayload } = payload;

  // schedule is meaningful for articles only (model contract).
  if (cleanPayload.type !== POST_TYPE_ENUMS.ARTICLE) delete cleanPayload.schedule;

  const post = new Post({ ...cleanPayload, _id: postId, banner, images });
  const saved = await post.save();

  // Rebuild match keywords + fan out off the request path (LIVE posts only).
  await enqueuePostKeywords(saved._id);

  return saved;
};

export const update = async ({ query, payload }: IPostUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const post = await getOne({ query: sanitizedQuery });

  const mediaSet: { banner?: Types.ObjectId | null; images?: Types.ObjectId[] } = {};

  // Replace the banner only when the field is part of this write (null clears it).
  if (payload.bannerStorage !== undefined) {
    let newBanner: Types.ObjectId | null = null;
    if (payload.bannerStorage) {
      const media = await createPostMedia(post._id, payload.bannerStorage);
      newBanner = media._id as Types.ObjectId;
    }
    if (post.banner) await safeDeleteMedia(post.banner);
    mediaSet.banner = newBanner;
  }

  // Replace the whole images set when new uploads are provided.
  if (payload.imagesStorage) {
    if (post.images?.length) await Promise.all(post.images.map((id: Types.ObjectId) => safeDeleteMedia(id)));
    const created = await Promise.all(payload.imagesStorage.map((storage) => createPostMedia(post._id, storage)));
    mediaSet.images = created.map((file) => file._id as Types.ObjectId);
  }

  const { bannerStorage, imagesStorage, ...cleanPayload } = payload;

  const updatedPost = await Post.findOneAndUpdate(
    { _id: post._id },
    { $set: { ...cleanPayload, ...mediaSet } },
    { new: true }
  );

  if (!updatedPost) throw new NotFoundException("Post not found.");

  // Re-fan-out on update: a draft flipped to LIVE (or edited text) is picked up here.
  await enqueuePostKeywords(updatedPost._id);

  return updatedPost;
};

export const softDelete = async ({ query }: IPostGetParams) => {
  const { deleted } = await Post.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Post not found to delete.");
  const result = await getOneSoftDeleted({ query: sanitizeQueryIds(query) });
  return result;
};

export const hardDelete = async ({ query }: IPostGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const post = await getOneSoftDeleted({ query: sanitizedQuery });

  // Delete all attached media (banner + images) from S3 concurrently.
  const mediaIds = [post.banner, ...(post.images ?? [])].filter(Boolean) as Types.ObjectId[];
  await Promise.all(mediaIds.map((id) => safeDeleteMedia(id)));

  const deletedPost = await Post.findOneAndDelete({ _id: post._id });
  if (!deletedPost) throw new NotFoundException("Post not found to delete.");
  return deletedPost;
};

export const restore = async ({ query }: IPostGetParams) => {
  const { restored } = await Post.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Post not found in trash.");
  const result = await getOne({ query: sanitizeQueryIds(query) });
  return result;
};
