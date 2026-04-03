/* eslint-disable @typescript-eslint/no-explicit-any */
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

export const list = ({ query = {}, options, allowedFields }: IListUserParams) => {
  return User.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...userProjectionQuery(allowedFields)],
    options
  );
};

export const getOne = async ({ query = {}, allowedFields }: IUserGetParams) => {
  const users = await User.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...userProjectionQuery(allowedFields),
  ]);
  if (users.length === 0) throw new NotFoundException("User not found.");
  return users[0];
};

export const listSoftDeleted = async ({ query = {}, options, allowedFields }: IListUserParams) => {
  return User.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...userProjectionQuery(allowedFields)],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {}, allowedFields }: IUserGetParams) => {
  const users = await User.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...userProjectionQuery(allowedFields),
  ]);
  if (users.length === 0) throw new NotFoundException("User not found in trash.");
  return users[0];
};

export const create = async ({ payload, allowedFields }: IUserCreateParams) => {
  let user = new User(payload);
  user = await user.save();

  return getOne({
    query: { _id: user._id } as any,
    allowedFields,
  });
};
export const getUserById = async (id: string) => {
  const user = await User.findOneWithExcludeDeleted({ _id: id });
  if (!user) throw new NotFoundException("User not found.");
  return user;
};

export const getUserByEmail = (email: string) => {
  return User.findOneWithExcludeDeleted({ email });
};

export const update = async ({ query, payload, allowedFields }: IUserUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const user = await getOne({ query: sanitizedQuery });

  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id },
    {
      $set: { ...payload },
    },
    {
      new: true,
      select: allowedFields, // Mongoose native projection
    }
  );

  if (!updatedUser) throw new NotFoundException("User not found.");
  return updatedUser;
};

export const softDelete = async ({ query, allowedFields }: IUserGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const userToSoftDelete = await getOne({ query: sanitizedQuery });

  const { deleted } = await User.softDelete({ _id: userToSoftDelete._id });
  if (!deleted) throw new NotFoundException("User not found to delete.");

  // Original logic: Modify the email to avoid unique constraint conflicts
  await User.findOneAndUpdate(
    { _id: userToSoftDelete._id },
    { $set: { email: `[deleted-${userToSoftDelete._id.toString()}]` } }
  );

  // Return sanitized document using allowedFields
  const user = await getOneSoftDeleted({ query: sanitizedQuery, allowedFields });
  return user;
};

export const hardDelete = async ({ query, allowedFields }: IUserGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);

  // Fetch sanitized document before deleting it
  const user = await getOneSoftDeleted({ query: sanitizedQuery, allowedFields });

  // Clean up related files in S3
  if (user.profileImageId) {
    try {
      await FileMediaService.hardDelete({ query: { _id: user.profileImageId.toString() } });
    } catch (error) {
      console.error("Failed to delete attached profile image for User:", error);
    }
  }

  const deletedUser = await User.findOneAndDelete({ _id: user._id });
  if (!deletedUser) throw new NotFoundException("User not found to delete.");

  return user;
};

export const restore = async ({ query, allowedFields }: IUserGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { restored } = await User.restore(sanitizedQuery);

  if (!restored) throw new NotFoundException("User not found in trash.");

  // Return sanitized document using allowedFields
  const user = await getOne({ query: sanitizedQuery, allowedFields });
  return user;
};

export const updateUserProfileImage = async ({
  query,
  payload,
  allowedFields,
}: IUserUpdateParams & { payload: AwsStorageTemplate }) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const user = await getOne({ query: sanitizedQuery });

  const fileMedia = await FileMediaService.create({
    payload: {
      collectionName: modelNames.USER,
      collectionDocument: user._id,
      storageInformation: payload,
      visibility: VISIBILITY_ENUM.PUBLIC,
    },
  });

  const previousProfileImageStorage = user.profileImageId;

  const updatedUser = await User.findOneAndUpdate(
    { _id: user._id },
    {
      $set: { profileImageId: fileMedia._id },
    },
    {
      new: true,
      select: allowedFields,
    }
  );

  if (previousProfileImageStorage) {
    try {
      await FileMediaService.hardDelete({
        query: { _id: previousProfileImageStorage.toString() },
      });
    } catch (error) {
      console.error(`Failed to delete old profile image for User ${user._id}`, error);
    }
  }

  return updatedUser;
};
