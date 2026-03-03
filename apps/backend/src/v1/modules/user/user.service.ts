import { NotFoundException, sanitizeQueryIds } from "../../../common/helper";
import { Types } from "mongoose";
import { IListUserParams } from "./user.interface";
import { User, UserInput } from "../../../models";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { matchQuery, userProjectionQuery, excludeDeletedQuery } from "./user.query";
import * as fileMediaService from "../file-media/file-media.service";
import { VISIBILITY_ENUM } from "@rl/types";
import { modelNames } from "../../../models/constants";

export const listUser = ({ query = {}, options }: IListUserParams) => {
  const users = User.aggregatePaginate([...matchQuery(query), ...excludeDeletedQuery(), ...userProjectionQuery()], {
    ...options,
    sort: { createdAt: -1 },
  });
  return users;
};

export const getUser = async ({ query = {} }: IListUserParams) => {
  const users = await User.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...userProjectionQuery(),
  ]);
  if (users.length === 0) throw new NotFoundException("User not found.");

  return users[0];
};

export const getUserById = async (id: string) => {
  const user = await User.findOneWithExcludeDeleted({ _id: id });
  if (!user) throw new NotFoundException("User not found.");
  return user;
};

export const getUserByIdIncludingDeleted = (id: string) => {
  const user = User.findById(id);
  if (!user) throw new NotFoundException("User not found.");
  return user;
};

export const getUserByEmail = (email: string) => {
  return User.findOneWithExcludeDeleted({ email });
};

export const updateUser = async (id: string, payload: Partial<UserInput>) => {
  const updatedUser = await User.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  return updatedUser;
};

export const createUser = async (payload: UserInput) => {
  let user = new User(payload);
  user = await user.save();

  return user;
};

export const softRemoveUser = async (id: string) => {
  const { deleted } = await User.softDelete({ _id: id });

  // const { user } = await updateUser(id, { email: `[deleted-${user.email}-${user._id}]` });
  const user = await updateUser(id, { email: `[deleted-${id}]` });

  return { user, deleted };
};

export const hardRemoveUser = async (id: string) => {
  const user = await User.findOneAndDelete({ _id: id });
  return user;

  // todo - delete all the files in s3 related to the user
};

export const restoreUser = async (id: string) => {
  const { restored } = await User.restore({ _id: id });
  if (!restored) throw new NotFoundException("User not found in trash.");

  const user = await getUser({
    query: { _id: id },
  });

  return { user, restored };
};

export const updateUserProfileImage = async (id: string, payload: AwsStorageTemplate) => {
  const user = await getUser({
    query: { _id: id },
  });

  const fileMedia = await fileMediaService.create({
    payload: {
      collectionName: modelNames.USER,
      collectionDocument: user._id,
      storageInformation: payload,
      visibility: VISIBILITY_ENUM.PUBLIC,
    },
  });
  const previousProfileImageStorage = user.profileImageId;

  await updateUser(id, {
    profileImageId: new Types.ObjectId(fileMedia._id as string),
  });

  if (previousProfileImageStorage) {
    await fileMediaService.hardDelete({
      query: { _id: previousProfileImageStorage },
    });

    return {
      profileImageId: fileMedia._id,
      ...user,
    };
  }
};
