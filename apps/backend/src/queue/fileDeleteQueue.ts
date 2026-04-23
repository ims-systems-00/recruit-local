import { Job } from "bullmq";
import { FileManager, logger } from "../common/helper";
import { s3Client } from "../.config/s3.config";
import { ReusableQueue } from "./Queue";

export interface FileDeleteJobFile {
  Bucket: string;
  Key: string;
}

export interface FileDeleteJobData {
  files: FileDeleteJobFile[];
}

const fileManager = new FileManager(s3Client);

const processFileDelete = async (job: Job<FileDeleteJobData>) => {
  const { files } = job.data;

  if (!Array.isArray(files) || files.length === 0) {
    logger.warn(`[fileDeleteQueue] No files supplied for job ${job.id}`);
    return;
  }

  for (const file of files) {
    if (!file?.Bucket || !file?.Key) continue;
    await fileManager.deleteFile({ Bucket: file.Bucket, Key: file.Key });
  }
};

export const fileDeleteQueue = new ReusableQueue<FileDeleteJobData>("fileDeleteQueue", processFileDelete);
