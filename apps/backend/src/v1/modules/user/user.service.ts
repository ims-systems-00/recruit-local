/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClientSession } from "mongoose"; // Added missing import
import { VISIBILITY_ENUM } from "@rl/types";
import { User } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { userProjectionQuery } from "./user.query";
import * as FileMediaService from "../file-media/file-media.service";
import { modelNames } from "../../../models/constants";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { IListUserParams, IUserGetParams, IUserCreateParams, IUserUpdateParams } from "./user.interface";

export const list = ({ query = {}, options, session }: IListUserParams) => {
  const aggregate = User.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...userProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return User.aggregatePaginate(aggregate, options);
};

export const getOne = async ({ query = {}, session }: IUserGetParams) => {
  const aggregate = User.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...userProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const users = await aggregate;

  if (users.length === 0) throw new NotFoundException("User not found.");
  return users[0];
};

export const listSoftDeleted = async ({ query = {}, options, session }: IListUserParams) => {
  const aggregate = User.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...userProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  return User.aggregatePaginate(aggregate, options);
};

export const getOneSoftDeleted = async ({ query = {}, session }: IUserGetParams) => {
  const aggregate = User.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...userProjectionQuery(),
  ]);

  if (session) aggregate.session(session);

  const users = await aggregate;

  if (users.length === 0) throw new NotFoundException("User not found in trash.");
  return users[0];
};

export const create = async ({ payload, session }: IUserCreateParams) => {
  let user = new User(payload);
  user = await user.save({ session });

  return getOne({
    query: { _id: user._id } as any,
    session,
  });
};

export const getUserById = async (id: string, session?: ClientSession) => {
  const query = User.findOneWithExcludeDeleted({ _id: id });
  if (session) query.session(session);

  const user = await query;
  if (!user) throw new NotFoundException("User not found.");
  return user;
};

export const getUserByEmail = (email: string, session?: ClientSession) => {
  const query = User.findOneWithExcludeDeleted({ email });
  if (session) query.session(session);

  return query;
};

export const update = async ({ query, payload, session }: IUserUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const user = await getOne({ query: sanitizedQuery, session });

  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id },
    { $set: payload },
    {
      new: true,
      session,
    }
  );

  if (!updatedUser) throw new NotFoundException("User not found.");
  return updatedUser;
};

export const softDelete = async ({ query, session }: IUserGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const userToSoftDelete = await getOne({ query: sanitizedQuery, session });

  const { deleted } = await User.softDelete({ _id: userToSoftDelete._id }, { session });
  if (!deleted) throw new NotFoundException("User not found to delete.");

  // Modify the email to avoid unique constraint conflicts
  await User.findOneAndUpdate(
    { _id: userToSoftDelete._id },
    { $set: { email: `[deleted-${userToSoftDelete._id.toString()}]` } },
    { session }
  );

  // Return sanitized document
  const user = await getOneSoftDeleted({ query: sanitizedQuery, session });
  return user;
};

export const hardDelete = async ({ query, session }: IUserGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  // Fetch sanitized document before deleting it
  const user = await getOneSoftDeleted({ query: sanitizedQuery, session });

  // Clean up related files in S3
  if (user.profileImageId) {
    try {
      // Assuming FileMediaService has also been updated to accept sessions
      await FileMediaService.hardDelete({
        query: { _id: user.profileImageId.toString() },
        // session,
      });
    } catch (error) {
      console.error("Failed to delete attached profile image for User:", error);
    }
  }

  const deletedUser = await User.findOneAndDelete({ _id: user._id }, { session });
  if (!deletedUser) throw new NotFoundException("User not found to delete.");

  return user;
};

export const restore = async ({ query, session }: IUserGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { restored } = await User.restore(sanitizedQuery, { session });

  if (!restored) throw new NotFoundException("User not found in trash.");

  // Return sanitized document
  const user = await getOne({ query: sanitizedQuery, session });
  return user;
};

export const updateUserProfileImage = async ({
  query,
  payload,
  session,
}: Omit<IUserUpdateParams, "payload"> & { payload: AwsStorageTemplate }) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const user = await getOne({ query: sanitizedQuery, session });

  const fileMedia = await FileMediaService.create({
    payload: {
      collectionName: modelNames.USER,
      collectionDocument: user._id,
      storageInformation: payload,
      visibility: VISIBILITY_ENUM.PUBLIC,
    },
    // session, // Passing session down to file media service
  });

  const previousProfileImageStorage = user.profileImageId;

  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id },
    { $set: { profileImageId: fileMedia._id } },
    {
      new: true,
      session,
    }
  );

  if (previousProfileImageStorage) {
    try {
      await FileMediaService.hardDelete({
        query: { _id: previousProfileImageStorage.toString() },
        // session,
      });
    } catch (error) {
      console.error(`Failed to delete old profile image for User ${user._id}`, error);
    }
  }

  return updatedUser;
};
