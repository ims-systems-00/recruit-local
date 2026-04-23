import fs from "fs";
import os from "os";
import path from "path";
import { Job } from "bullmq";
import sharp from "sharp";
import { createCanvas } from "@napi-rs/canvas";

import { FileMedia } from "../models";
import { ReusableQueue } from "./Queue";
import { FileManager, logger } from "../common/helper";
import { s3Client } from "../.config/s3.config";

export interface ThumbnailCreateJobData {
  fileMediaId: string;
}

const IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "gif", "bmp", "webp", "heic", "heif", "avif"]);

const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "avi", "mkv", "webm", "m4v"]);
const PDF_EXTENSIONS = new Set(["pdf"]);
const DOC_EXTENSIONS = new Set(["doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "rtf"]);

const fileManager = new FileManager(s3Client);

const getFileExtension = (name: string): string => {
  return path
    .extname(name || "")
    .toLowerCase()
    .replace(".", "");
};

const getMediaLabel = (ext: string): string => {
  if (PDF_EXTENSIONS.has(ext)) return "PDF";
  if (DOC_EXTENSIONS.has(ext)) return "DOC";
  if (VIDEO_EXTENSIONS.has(ext)) return "VIDEO";
  return "FILE";
};

const buildThumbnailPng = async (label: string): Promise<Buffer> => {
  const safeLabel = label.replace(/[^A-Z0-9]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#111827"/><stop offset="100%" stop-color="#334155"/></linearGradient></defs><rect width="512" height="512" rx="48" fill="url(#bg)"/><rect x="96" y="88" width="320" height="336" rx="24" fill="#f8fafc" fill-opacity="0.95"/><rect x="120" y="120" width="272" height="32" rx="16" fill="#cbd5e1"/><rect x="120" y="176" width="196" height="24" rx="12" fill="#cbd5e1"/><text x="256" y="324" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="74" font-weight="700" fill="#0f172a">${safeLabel}</text></svg>`;
  return sharp(Buffer.from(svg, "utf-8")).png().toBuffer();
};

const decodePossiblyBase64Pdf = (buffer: Buffer): Buffer => {
  const prefixText = buffer.subarray(0, 32).toString("utf-8");
  const looksLikeBase64Pdf = prefixText.startsWith("JVBER");

  if (!looksLikeBase64Pdf) {
    return buffer;
  }

  const asciiPayload = buffer.toString("utf-8").replace(/\s+/g, "");
  const decoded = Buffer.from(asciiPayload, "base64");

  if (decoded.subarray(0, 5).toString("utf-8") === "%PDF-") {
    console.log("[thumbnailCreateQueue][PDF] Decoded base64 payload to binary PDF", {
      originalSize: buffer.length,
      decodedSize: decoded.length,
    });
    return decoded;
  }

  console.log("[thumbnailCreateQueue][PDF] Base64-like payload could not be decoded to valid PDF header", {
    originalSize: buffer.length,
    decodedPrefix: decoded.subarray(0, 8).toString("hex"),
  });

  return buffer;
};

const renderPdfThumbnail = async (pdfPath: string): Promise<Buffer> => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const rawPdfBuffer = fs.readFileSync(pdfPath);
  const pdfBuffer = decodePossiblyBase64Pdf(rawPdfBuffer);
  const prefixText = pdfBuffer.subarray(0, 32).toString("utf-8");
  const prefixHex = pdfBuffer.subarray(0, 16).toString("hex");
  const looksLikeBase64Pdf = prefixText.startsWith("JVBER");

  console.log("[thumbnailCreateQueue][PDF] Incoming PDF debug", {
    path: pdfPath,
    size: pdfBuffer.length,
    prefixText,
    prefixHex,
    looksLikeBase64Pdf,
  });

  const pdfData = new Uint8Array(pdfBuffer);

  const loadingTask = pdfjs.getDocument({
    data: pdfData,
    useWorkerFetch: false,
    isEvalSupported: false,
    isOffscreenCanvasSupported: false,
    stopAtErrors: false,
  });

  const pdfDocument = await loadingTask.promise;
  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 1.25 });

  const canvas = createCanvas(viewport.width, viewport.height);
  const context = canvas.getContext("2d");

  await page.render({
    canvas: canvas as any,
    canvasContext: context as any,
    viewport,
  }).promise;

  await pdfDocument.destroy();

  return canvas.toBuffer("image/png");
};

const getThumbnailKey = (originalKey: string) => {
  const parsed = path.posix.parse(originalKey);
  const directory = parsed.dir ? `${parsed.dir}/` : "";
  return `${directory}thumbnails/${parsed.name}-thumb-${Date.now()}.png`;
};

const processThumbnailCreate = async (job: Job<ThumbnailCreateJobData>) => {
  const { fileMediaId } = job.data;

  const fileMedia = await FileMedia.findById(fileMediaId);

  if (!fileMedia) {
    logger.warn(`[thumbnailCreateQueue] FileMedia not found: ${fileMediaId}`);
    return;
  }

  const { Bucket, Key, Name } = fileMedia.storageInformation;

  const tempInputPath = path.join(os.tmpdir(), `${fileMediaId}-${Date.now()}-${path.basename(Key || Name || "file")}`);

  try {
    await FileMedia.findByIdAndUpdate(fileMediaId, {
      $set: { thumbnailStatus: "processing" },
    });

    const ext = getFileExtension(Key || Name || "");

    await fileManager.downloadFileFromS3(tempInputPath, { Bucket, Key });

    let thumbnailBuffer: Buffer;
    let contentType = "image/png";

    if (IMAGE_EXTENSIONS.has(ext)) {
      thumbnailBuffer = await sharp(tempInputPath).resize(300, 300, { fit: "inside" }).jpeg({ quality: 80 }).toBuffer();
      contentType = "image/jpeg";
    } else if (PDF_EXTENSIONS.has(ext)) {
      console.log("[thumbnailCreateQueue][PDF] Processing file", {
        fileMediaId,
        key: Key,
        bucket: Bucket,
        ext,
      });
      try {
        thumbnailBuffer = await renderPdfThumbnail(tempInputPath);
      } catch (pdfError) {
        logger.warn(`[Thumbnail] Falling back for PDF ${fileMediaId}`, pdfError);
        thumbnailBuffer = await buildThumbnailPng("PDF");
      }
    } else {
      const label = getMediaLabel(ext);
      thumbnailBuffer = await buildThumbnailPng(label);
    }

    const thumbnailKey = getThumbnailKey(Key);
    const previousThumbnail = fileMedia.thumbnail;

    const uploadedThumbnail = await fileManager.uploadFileToS3({
      file: thumbnailBuffer,
      bucket: Bucket,
      key: thumbnailKey,
      contentType,
    });

    if (previousThumbnail?.Key && previousThumbnail.Key !== uploadedThumbnail.Key) {
      await fileManager.deleteFile({
        Bucket: previousThumbnail.Bucket,
        Key: previousThumbnail.Key,
      });
    }

    await FileMedia.findByIdAndUpdate(fileMediaId, {
      $set: {
        thumbnail: {
          Name: uploadedThumbnail.Name,
          Key: uploadedThumbnail.Key,
          Bucket: uploadedThumbnail.Bucket,
        },
        thumbnailStatus: "completed",
      },
    });

    logger.info(`[Thumbnail] Completed for ${fileMediaId}`);
  } catch (error) {
    logger.error(`[Thumbnail] Failed for ${fileMediaId}`, error);

    await FileMedia.findByIdAndUpdate(fileMediaId, {
      $set: { thumbnailStatus: "failed" },
    });

    throw error; // triggers retry + DLQ
  } finally {
    if (fs.existsSync(tempInputPath)) {
      fs.unlinkSync(tempInputPath);
    }
  }
};

export const thumbnailCreateQueue = new ReusableQueue<ThumbnailCreateJobData>(
  "thumbnailCreateQueue",
  processThumbnailCreate
);
