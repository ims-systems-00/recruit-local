import { S3Client } from "@aws-sdk/client-s3";
import { FileManager, NotFoundException } from "../../../common/helper";
import { IListUserParams } from "./user.interface";
import { User, UserInput } from "../../../models";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
  },
  region: "eu-west-2",
});

export const listUser = ({ query = {}, options }: IListUserParams) => {
  return User.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getUser = async (id: string) => {
  const user = await User.findOneWithExcludeDeleted({ _id: id });
  if (!user) throw new NotFoundException("User not found.");

  return user;
};

export const getUserByEmail = (email: string) => {
  return User.findOneWithExcludeDeleted({ email });
};

export const updateUser = async (id: string, payload: Partial<UserInput>) => {
  await getUser(id);
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
  const user = await getUser(id);
  const { deleted } = await User.softDelete({ _id: id });

  // Update email to avoid duplication
  user.email = `[deleted-${user.email}-${user._id}]`;
  await user.save();

  return { user, deleted };
};

export const hardRemoveUser = async (id: string) => {
  const user = await getUser(id);
  await User.findOneAndDelete({ _id: id });

  return user;
};

export const restoreUser = async (id: string) => {
  const { restored } = await User.restore({ _id: id });
  if (!restored) throw new NotFoundException("User not found in trash.");

  const user = await getUser(id);

  return { user, restored };
};

export const updateUserProfileImage = async (id: string, payload: AwsStorageTemplate) => {
  const user = await getUser(id);
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
