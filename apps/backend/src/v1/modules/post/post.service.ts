import { IListParams, ListQueryParams } from "@rl/types";
import { Post, IPostInput } from "../../../models";
import { FileManager, NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { s3Client } from "../../../.config/s3.config";
import { postProjectQuery } from "./post.query";

type IListPostParams = IListParams<IPostInput>;
type IPostQueryParams = ListQueryParams<IPostInput>;

export const list = ({ query = {}, options }: IListPostParams) => {
  return Post.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...populateStatusQuery(), ...postProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListPostParams) => {
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

export const getOneSoftDeleted = async ({ query = {} }: IListPostParams) => {
  const posts = await Post.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...postProjectQuery(),
  ]);
  if (posts.length === 0) throw new NotFoundException("Post not found in trash.");
  return posts[0];
};

export const create = async (payload: IPostInput) => {
  // Check if the payload includes images
  if (payload.images && payload.images.length > 0) {
    const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL;

    // Map over the array to attach the generated src to each image
    payload.images = payload.images.map((image) => {
      return {
        ...image,
        src: `${baseUrl}/${image.storage.Key}`,
      };
    });
  }

  // Create the post with the newly formatted payload
  const post = await Post.create(payload);
  return post;
};

export const update = async (query: IPostQueryParams, payload: Partial<IPostInput>) => {
  const post = await Post.findOne(sanitizeQueryIds(query));
  if (!post) throw new NotFoundException("Post not found.");

  // Check if the update includes a new set of images
  if (payload.images) {
    const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL;
    const fileManager = new FileManager(s3Client);

    // Extract the S3 Keys of the current images
    const oldImageKeys = post.images?.map((img) => img.storage.Key) || [];
    const newImageKeys: string[] = [];

    // Map through the new images to build the src and collect their keys
    payload.images = payload.images.map((image) => {
      newImageKeys.push(image.storage.Key);
      return {
        ...image,
        src: `${baseUrl}/${image.storage.Key}`,
      };
    });

    // Identify images that are in the database but NOT in the new payload
    const keysToDelete = oldImageKeys.filter((key) => !newImageKeys.includes(key));

    //Delete the orphaned images from S3
    for (const key of keysToDelete) {
      const oldImage = post.images?.find((img) => img.storage.Key === key);
      if (oldImage && typeof oldImage.storage.Key === "string") {
        fileManager.deleteFile({
          Bucket: oldImage.storage.Bucket,
          Key: oldImage.storage.Key,
        });
      }
    }
  }

  post.set(payload);
  await post.save();

  return post;
};

export const softDelete = async (query: IPostQueryParams) => {
  const post = await Post.findOneAndUpdate(sanitizeQueryIds(query), { deletedAt: new Date() }, { new: true });
  if (!post) throw new NotFoundException("Post not found.");
  return post;
};

export const restore = async (query: IPostQueryParams) => {
  const post = await Post.findOneAndUpdate(sanitizeQueryIds(query), { deletedAt: null }, { new: true });
  if (!post) throw new NotFoundException("Post not found in trash.");
  return post;
};

export const hardDelete = async (query: IPostQueryParams) => {
  const post = await Post.findOneAndDelete(sanitizeQueryIds(query));
  if (!post) throw new NotFoundException("Post not found.");
  return post;
};
