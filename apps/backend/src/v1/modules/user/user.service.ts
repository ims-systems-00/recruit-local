import { s3Client } from "../../../.config/s3.config";
import { FileManager, NotFoundException } from "../../../common/helper";
import { IListUserParams } from "./user.interface";
import { User, UserInput } from "../../../models";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { matchQuery, userProjectionQuery, excludeDeletedQuery } from "./user.query";

export const listUser = ({ query = {}, options }: IListUserParams) => {
  // return User.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
  const users = User.aggregatePaginate([...matchQuery(query), ...excludeDeletedQuery(), ...userProjectionQuery()], {
    ...options,
    sort: { createdAt: -1 },
  });
  return users;
};

export const getUser = async ({ query = {} }: IListUserParams) => {
  // const user = await User.findOneWithExcludeDeleted(query);
  // if (!user) throw new NotFoundException("User not found.");

  // return user;

  const users = await User.aggregate([...matchQuery(query), ...excludeDeletedQuery(), ...userProjectionQuery()]);
  if (users.length === 0) throw new NotFoundException("User not found.");

  return users[0];
};

export const getUserById = (id: string) => {
  return User.findOneWithExcludeDeleted({ _id: id });
};

export const getUserByEmail = (email: string) => {
  return User.findOneWithExcludeDeleted({ email });
};

export const updateUser = async (id: string, payload: Partial<UserInput>) => {
  await getUser({ query: { _id: id } });
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
  const user = await getUser({
    query: { _id: id },
  });
  const { deleted } = await User.softDelete({ _id: id });

  // Update email to avoid duplication
  user.email = `[deleted-${user.email}-${user._id}]`;
  await user.save();

  return { user, deleted };
};

export const hardRemoveUser = async (id: string) => {
  const user = await getUser({
    query: { _id: id },
  });
  await User.findOneAndDelete({ _id: id });

  return user;
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
  const fileManager = new FileManager(s3Client);
  const previousProfileImageStorage = user.profileImageStorage;

  const logoSrc = process.env.PUBLIC_MEDIA_BASE_URL + "/" + payload.Key;
  user.profileImageSrc = logoSrc;
  user.profileImageStorage = payload;
  await user.save();

  // delete the previous file from s3
  if (typeof previousProfileImageStorage?.Key === "string") {
    const { Bucket, Key } = previousProfileImageStorage;
    fileManager.deleteFile({ Bucket, Key });
  }

  return user;
};
