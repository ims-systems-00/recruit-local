import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import { logger } from "./logger";
import * as fs from "fs";
export interface FileInformation {
  Bucket: string;
  Key: string;
}

export interface MetaInfo extends FileInformation {
  Name: string;
  Bucket: string;
  Key: string;
}

export interface UploadUrlResponse {
  signedUrl: string;
  metaInfo: MetaInfo;
}

export interface ViewUrlResponse {
  signedUrl: string;
}

export interface UploadFileParams {
  file: Buffer | Readable;
  bucket: string;
  key: string;
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface UploadResponse {
  Key: string;
  Bucket: string;
  Name: string;
  Location?: string;
}

/**
 * A Content-Disposition that saves the file as `name`. The plain `filename` is
 * ASCII with quotes and backslashes replaced, since either would end the quoted
 * value early; `filename*` carries the exact name, non-ASCII included, for every
 * current browser.
 */
const attachmentDisposition = (name: string): string => {
  const asciiName = name.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  const encodedName = encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
  return `attachment; filename="${asciiName}"; filename*=UTF-8''${encodedName}`;
};

class FileManager {
  private s3Client: S3Client;

  constructor(s3Client: S3Client) {
    this.s3Client = s3Client;
  }

  private _isValidFile(_filename: string): boolean {
    return true;
    // const validExtensions = [".jpg", ".png", ".jpeg"];
    // return validExtensions.some((ext) => _filename.endsWith(ext));
  }

  /**
   * `keyPrefix` becomes the key's first segment (`<prefix>/<uuid>.<ext>`), so who
   * a file belongs to can be read back off its key.
   */
  async getSignedUrlForUpload(filename: string, bucket: string, keyPrefix?: string): Promise<UploadUrlResponse> {
    if (!this._isValidFile(filename)) {
      throw new Error("A valid file name is required.");
    }

    const filenameSplited = filename.split("/");
    const originalFilename = filenameSplited[filenameSplited.length - 1];
    const originalFilenameSplited = originalFilename.split(".");
    const extension = originalFilenameSplited[originalFilenameSplited.length - 1];
    const fileName = `${keyPrefix ? `${keyPrefix}/` : ""}${uuidv4()}.${extension}`;

    const params = {
      Bucket: bucket,
      Key: fileName,
    };

    const signedUrl = await getSignedUrl(this.s3Client, new PutObjectCommand(params), { expiresIn: 3 * 3600 });

    return {
      signedUrl,
      metaInfo: {
        Name: originalFilename,
        ...params,
      },
    };
  }

  /**
   * `downloadAs` makes the link save the file under that name, rather than open
   * it in the browser.
   */
  async getSignedUrlForView(fileInformation: FileInformation, downloadAs?: string): Promise<ViewUrlResponse> {
    const params = {
      Bucket: fileInformation.Bucket,
      Key: fileInformation.Key,
      ...(downloadAs && { ResponseContentDisposition: attachmentDisposition(downloadAs) }),
    };

    const signedLink = await getSignedUrl(this.s3Client, new GetObjectCommand(params), { expiresIn: 12 * 3600 });

    return { signedUrl: signedLink };
  }

  async deleteFile(fileInformation: FileInformation): Promise<FileInformation> {
    const params = {
      Bucket: fileInformation.Bucket,
      Key: fileInformation.Key,
    };

    try {
      const command = new DeleteObjectCommand(params);
      await this.s3Client.send(command);

      return fileInformation;
    } catch (error) {
      logger.error("Error deleting file from S3:", error);
    }
  }

  async getFileAsBuffer(fileInformation: FileInformation): Promise<Buffer> {
    const params = { Bucket: fileInformation.Bucket, Key: fileInformation.Key };
    const response = await this.s3Client.send(new GetObjectCommand(params));

    if (!response.Body) {
      throw new Error("No file content received from S3");
    }

    const stream = response.Body as Readable;
    const chunks: Buffer[] = [];

    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("error", reject);
      stream.on("end", () => resolve(Buffer.concat(chunks)));
    });
  }

  async downloadFileFromS3(destinationPath: string, fileInformation: FileInformation): Promise<void> {
    const params = {
      Bucket: fileInformation.Bucket,
      Key: fileInformation.Key,
    };

    try {
      const command = new GetObjectCommand(params);
      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error("No file content received from S3");
      }

      // Convert the readable stream to a buffer
      const stream = response.Body as Readable;
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        stream.on("error", (err) => reject(err));
        stream.on("end", () => {
          const buffer = Buffer.concat(chunks);
          // Write the buffer to the destination file
          fs.writeFileSync(destinationPath, buffer);
          resolve();
        });
      });
    } catch (error) {
      throw new Error(`Failed to download file from S3: ${error.message}`);
    }
  }

  async uploadFileToS3(params: UploadFileParams): Promise<UploadResponse> {
    const { file, bucket, key, contentType = "application/octet-stream", metadata = {} } = params;

    // Generate a unique key if not provided
    const fileKey = key || `${uuidv4()}-${Date.now()}`;

    const uploadParams = {
      Bucket: bucket,
      Key: fileKey,
      Body: file,
      ContentType: contentType,
      Metadata: metadata,
    };

    try {
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);

      return {
        Key: fileKey,
        Bucket: bucket,
        Name: fileKey.split("/").pop() || fileKey,
      };
    } catch (error) {
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  async uploadFileFromPathToS3(filePath: string, params: Omit<UploadFileParams, "file">): Promise<UploadResponse> {
    const fileStream = fs.createReadStream(filePath);
    return this.uploadFileToS3({ ...params, file: fileStream });
  }
}

export { FileManager };
