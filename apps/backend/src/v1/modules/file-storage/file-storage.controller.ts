import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams, ForbiddenException } from "../../../common/helper";
import { S3Client } from "@aws-sdk/client-s3";
import { FileManager } from "../../../common/helper/file-manager";

const s3Client = new S3Client({
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET!,
  },
  region: "eu-west-2",
});

export const getSignedUrlForUpload = async ({ req }: ControllerParams) => {
  const filename = req.header("x-file-name");
  const storageType = req.header("x-storage-type") as string;
  let bucket = process.env.AWS_PRIVATE_MEDIA_BUCKET;
  let baseUrl = null;

  if (storageType === "public") {
    bucket = process.env.AWS_PUBLIC_MEDIA_BUCKET;
    baseUrl = process.env.PUBLIC_MEDIA_BASE_URL + "/";
  }

  const fileManager = new FileManager(s3Client);
  // Stored under the uploader's id, so the view link below can tell whose file a key is.
  const results = await fileManager.getSignedUrlForUpload(filename!, bucket!, String(req.session.user?._id));
  const viewSrc = baseUrl ? baseUrl + results.metaInfo.Key : null;

  return new ApiResponse({
    message: "URL signed for upload: " + filename,
    statusCode: StatusCodes.OK,
    data: { ...results, viewSrc },
    fieldName: "fileStorage",
  });
};
/**
 * Signs a view link for one of the caller's own uploads only — any key they
 * name would otherwise let them read anyone's private file. A file that belongs
 * to a record is opened through that record's endpoint instead (a training's
 * `certificate-url`), which checks who may read the record.
 */
export const getSignedUrlForView = async ({ req }: ControllerParams) => {
  const filekey = req.header("x-file-key");
  if (!filekey || !filekey.startsWith(`${req.session.user?._id}/`)) {
    throw new ForbiddenException("You can only view files you uploaded.");
  }

  const fileManager = new FileManager(s3Client);
  const results = await fileManager.getSignedUrlForView({
    Key: filekey!,
    Bucket: process.env.AWS_PRIVATE_MEDIA_BUCKET!,
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
    Key: fileKey!,
    Bucket: process.env.AWS_PRIVATE_MEDIA_BUCKET!,
  });

  return new ApiResponse({
    message: "File deleted: " + fileKey,
    statusCode: StatusCodes.OK,
  });
};
