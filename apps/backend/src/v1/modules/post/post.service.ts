import { Types } from "mongoose";
import { IListParams, ListQueryParams, VISIBILITY_ENUM } from "@rl/types";
import { Post, IPostInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { postProjectQuery } from "./post.query";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// --- Standardized Parameter Interfaces ---
type IListPostParams = IListParams<IPostInput>;
type IPostQueryParams = ListQueryParams<IPostInput>;

export interface IPostUpdateParams {
  query: IPostQueryParams;
  payload: Partial<IPostInput> & { imagesStorage?: AwsStorageTemplate[] };
}

export interface IPostGetParams {
  query: IPostQueryParams;
}

export interface IPostCreateParams {
  payload: IPostInput & { imagesStorage?: AwsStorageTemplate[] };
}

export const list = ({ query = {}, options }: IListPostParams) => {
  return Post.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...populateStatusQuery(), ...postProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IPostGetParams) => {
  const posts = await Post.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateStatusQuery(),
    ...postProjectQuery(),
  ]);
  if (posts.length === 0) throw new NotFoundException("Post not found.");
  return posts[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListPostParams) => {
  return Post.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...populateStatusQuery(), ...postProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IPostGetParams) => {
  const posts = await Post.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...postProjectQuery(),
  ]);
  if (posts.length === 0) throw new NotFoundException("Post not found in trash.");
  return posts[0];
};

export const create = async ({ payload }: IPostCreateParams) => {
  const postId = new Types.ObjectId();
  let imageIds: Types.ObjectId[] = [];

  if (payload.imagesStorage && payload.imagesStorage.length > 0) {
    const imagePromises = payload.imagesStorage.map((storage) =>
      FileMediaService.create({
        payload: {
          collectionName: modelNames.POST,
          collectionDocument: postId,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
      })
    );
    const createdImages = await Promise.all(imagePromises);

    imageIds = createdImages.map((file: any) => file._id) as Types.ObjectId[];
  }

  // 3. Strip raw AWS data and save
  const { imagesStorage, ...cleanPayload } = payload;

  // Ensure statusId is treated as a clean ObjectId
  const finalStatusId = payload.statusId ? new Types.ObjectId(payload.statusId.toString()) : undefined;

  let post = new Post({
    ...cleanPayload,
    _id: postId,
    imageIds: imageIds,
    statusId: finalStatusId || (cleanPayload as any).statusId,
  });

  post = await post.save();
  return post;
};

export const update = async ({ query, payload }: IPostUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const post = await getOne({ query: sanitizedQuery });

  let updatedImageIds = post.imageIds || [];

  if (payload.imagesStorage) {
    if (post.imageIds && post.imageIds.length > 0) {
      try {
        await Promise.all(
          post.imageIds.map((id: any) => FileMediaService.hardDelete({ query: { _id: id.toString() } }))
        );
      } catch (error) {
        console.error(`Failed to delete old images for Post ${post._id}`, error);
      }
    }

    // 2. Create new images
    const imagePromises = payload.imagesStorage.map((storage) =>
      FileMediaService.create({
        payload: {
          collectionName: modelNames.POST,
          collectionDocument: post._id,
          storageInformation: storage,
          visibility: VISIBILITY_ENUM.PUBLIC,
        },
      })
    );
    const newImages = await Promise.all(imagePromises);
    updatedImageIds = newImages.map((file: any) => file._id) as Types.ObjectId[];
  }

  const { imagesStorage, ...cleanPayload } = payload;

  // Clean up statusId if it's being updated
  if (cleanPayload.statusId) {
    cleanPayload.statusId = new Types.ObjectId(cleanPayload.statusId.toString()) as any;
  }

  const updatedPost = await Post.findOneAndUpdate(
    { _id: post._id },
    {
      $set: {
        ...cleanPayload,
        imageIds: updatedImageIds,
      },
    },
    { new: true }
  );

  if (!updatedPost) throw new NotFoundException("Post not found.");
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

  // Delete all attached images from S3 concurrently
  if (post.imageIds && post.imageIds.length > 0) {
    try {
      await Promise.all(post.imageIds.map((id: any) => FileMediaService.hardDelete({ query: { _id: id.toString() } })));
    } catch (error) {
      console.error("Failed to delete images array for Post:", error);
    }
  }

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
