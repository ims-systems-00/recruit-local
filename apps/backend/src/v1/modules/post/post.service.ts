import { Types } from "mongoose";
import { IListParams, ListQueryParams, VISIBILITY_ENUM, POST_TYPE_ENUMS } from "@rl/types";
import { Post, IPostInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import {
  postProjectQuery,
  populatePostMediaQuery,
  populatePostCreatorQuery,
  alreadyReactedQuery,
  alreadySavedQuery,
  reactionCountQuery,
} from "./post.query";
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

/**
 * Who is reading. Drives the per-viewer `alreadyReacted` / `alreadySaved`
 * signals; omitting both is valid and yields the "not reacted, not saved"
 * defaults without any extra lookup (the internal re-reads after a write do
 * exactly that).
 */
interface IPostViewerContext {
  tenantId?: string;
  jobProfileId?: string;
}

// --- Standardized Parameter Interfaces ---
type IListPostParams = IListParams<IPostInput> & IPostViewerContext;
type IPostQueryParams = ListQueryParams<IPostInput>;

export interface IPostUpdateParams {
  query: IPostQueryParams;
  payload: Partial<IPostInput> & IPostStorage;
}

export interface IPostGetParams extends IPostViewerContext {
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

// Reads return `banner` / `images` populated with FileMedia documents; the media
// bookkeeping below works off the raw ids, so unwrap a populated ref back to one.
const toMediaId = (ref: unknown): Types.ObjectId | undefined => {
  if (!ref) return undefined;
  const populated = ref as { _id?: Types.ObjectId };
  return (populated._id ?? ref) as Types.ObjectId;
};

// Hard-delete a FileMedia this write replaces (non-fatal on error).
const safeDeleteMedia = async (id: Types.ObjectId) => {
  try {
    await FileMediaService.hardDelete({ query: { _id: id.toString() } });
  } catch (error) {
    console.error(`Failed to delete FileMedia ${id} for post`, error);
  }
};

export const list = ({ query = {}, options, tenantId, jobProfileId }: IListPostParams) => {
  return Post.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...excludeDeletedQuery(),
      ...populatePostMediaQuery(),
      ...populatePostCreatorQuery(),
      ...postProjectQuery(),
      // After the projection: none of these are schema paths, so it would drop them.
      ...alreadyReactedQuery(tenantId, jobProfileId),
      ...alreadySavedQuery(tenantId, jobProfileId),
      ...reactionCountQuery(),
    ],
    options
  );
};

export const getOne = async ({ query = {}, tenantId, jobProfileId }: IPostGetParams) => {
  const posts = await Post.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populatePostMediaQuery(),
    ...populatePostCreatorQuery(),
    ...postProjectQuery(),
    ...alreadyReactedQuery(tenantId, jobProfileId),
    ...alreadySavedQuery(tenantId, jobProfileId),
    ...reactionCountQuery(),
  ]);
  if (posts.length === 0) throw new NotFoundException("Post not found.");
  return posts[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListPostParams) => {
  return Post.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...onlyDeletedQuery(),
      ...populatePostMediaQuery(),
      ...populatePostCreatorQuery(),
      ...postProjectQuery(),
    ],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IPostGetParams) => {
  const posts = await Post.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populatePostMediaQuery(),
    ...populatePostCreatorQuery(),
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

  // Re-read so the response carries the populated banner/images, like every other read.
  return getOne({ query: { _id: String(saved._id) } });
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
    const oldBanner = toMediaId(post.banner);
    if (oldBanner) await safeDeleteMedia(oldBanner);
    mediaSet.banner = newBanner;
  }

  // Replace the whole images set when new uploads are provided.
  if (payload.imagesStorage) {
    const oldImages = (post.images ?? []).map(toMediaId).filter(Boolean) as Types.ObjectId[];
    if (oldImages.length) await Promise.all(oldImages.map((id) => safeDeleteMedia(id)));
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

  // Re-read so the response carries the populated banner/images, like every other read.
  return getOne({ query: { _id: String(updatedPost._id) } });
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
  const mediaIds = [post.banner, ...(post.images ?? [])].map(toMediaId).filter(Boolean) as Types.ObjectId[];
  await Promise.all(mediaIds.map((id) => safeDeleteMedia(id)));

  const deletedPost = await Post.findOneAndDelete({ _id: post._id });
  if (!deletedPost) throw new NotFoundException("Post not found to delete.");

  // Echo the pre-delete snapshot: it is the same document, but with the media
  // populated so the response shape matches every other post endpoint.
  return post;
};

export const restore = async ({ query }: IPostGetParams) => {
  const { restored } = await Post.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Post not found in trash.");
  const result = await getOne({ query: sanitizeQueryIds(query) });
  return result;
};
