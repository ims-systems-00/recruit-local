import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams } from "../../../common/helper";
import { S3Client } from "@aws-sdk/client-s3";
import { FileManager } from "../../../common/helper/file-manager";
const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
  },
  region: "eu-west-2",
});

export const getSignedUrlForUpload = async ({ req }: ControllerParams) => {
  const filename = req.header("x-file-name");
  const storageType = req.header("x-storage-type") as string;
  let bucket = process.env.AWS_PRIVATE_MEDIA_BUCKET;
  let viewSrc = null;

  if (storageType === "public") {
    bucket = process.env.AWS_PUBLIC_MEDIA_BUCKET;
    viewSrc = process.env.PUBLIC_MEDIA_BASE_URL + "/";
  }

  const fileManager = new FileManager(s3Client);
  const results = await fileManager.getSignedUrlForUpload(filename, bucket);

  return new ApiResponse({
    message: "URL signed for upload: " + filename,
    statusCode: StatusCodes.OK,
    data: { ...results, viewSrc: viewSrc + results.metaInfo.Key },
    fieldName: "fileStorage",
  });
};
export const getSignedUrlForView = async ({ req }: ControllerParams) => {
  const filekey = req.header("x-file-key");
  const fileManager = new FileManager(s3Client);
  const results = await fileManager.getSignedUrlForView({
    Key: filekey,
    Bucket: process.env.AWS_PRIVATE_MEDIA_BUCKET,
  });
  return new ApiResponse({
    message: "URL signed for view: " + filekey,
    statusCode: StatusCodes.OK,
    data: results,
    fieldName: "fileStorage",
  });
};

export const deleteFile = async ({ req }: ControllerParams) => {
  const fileKey = req.header("x-file-key");
  const fileManager = new FileManager(s3Client);

  await fileManager.deleteFile({
    Key: fileKey,
    Bucket: process.env.AWS_PRIVATE_MEDIA_BUCKET,
  });

  return new ApiResponse({
    message: "File deleted: " + fileKey,
    statusCode: StatusCodes.OK,
  });
};
