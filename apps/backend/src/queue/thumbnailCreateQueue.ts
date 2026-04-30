import fs from "fs";
import os from "os";
import path from "path";
import { execFile } from "child_process";
import { promisify } from "util";
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
const execFileAsync = promisify(execFile);

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

const looksLikeBase64OfficePayload = (buffer: Buffer): boolean => {
  const prefixText = buffer.subarray(0, 64).toString("utf-8");

  // Typical OOXML (.docx/.pptx/.xlsx) base64 starts with "UEsDB"
  // Legacy Office OLE payload may start with "0M8R4" when base64 encoded.
  return prefixText.startsWith("UEsDB") || prefixText.startsWith("0M8R4");
};

const decodePossiblyBase64Office = (buffer: Buffer): Buffer => {
  if (!looksLikeBase64OfficePayload(buffer)) {
    return buffer;
  }

  const asciiPayload = buffer.toString("utf-8").replace(/\s+/g, "");
  const decoded = Buffer.from(asciiPayload, "base64");

  // ZIP magic for OOXML: PK\x03\x04
  const isZipPayload =
    decoded.length >= 4 && decoded[0] === 0x50 && decoded[1] === 0x4b && decoded[2] === 0x03 && decoded[3] === 0x04;

  // OLE magic for legacy Office docs: D0 CF 11 E0 A1 B1 1A E1
  const isOlePayload =
    decoded.length >= 8 &&
    decoded[0] === 0xd0 &&
    decoded[1] === 0xcf &&
    decoded[2] === 0x11 &&
    decoded[3] === 0xe0 &&
    decoded[4] === 0xa1 &&
    decoded[5] === 0xb1 &&
    decoded[6] === 0x1a &&
    decoded[7] === 0xe1;

  if (isZipPayload || isOlePayload) {
    logger.warn("[thumbnailCreateQueue][Office] Decoded base64 payload to binary office format", {
      originalSize: buffer.length,
      decodedSize: decoded.length,
      format: isZipPayload ? "zip" : "ole",
    });

    return decoded;
  }

  return buffer;
};

const renderPdfThumbnail = async (pdfPath: string): Promise<Buffer> => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const rawPdfBuffer = fs.readFileSync(pdfPath);
  const pdfBuffer = decodePossiblyBase64Pdf(rawPdfBuffer);

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

const getLibreOfficeBinary = (): string => {
  if (process.env.LIBREOFFICE_BIN) {
    return process.env.LIBREOFFICE_BIN;
  }

  // Default macOS app bundle path works well for local development.
  const macOsSofficePath = "/Applications/LibreOffice.app/Contents/MacOS/soffice";
  if (process.platform === "darwin" && fs.existsSync(macOsSofficePath)) {
    return macOsSofficePath;
  }

  return "soffice";
};

const convertOfficeFileToPdf = async (inputPath: string, outputDir: string): Promise<string> => {
  const libreOfficeBin = getLibreOfficeBinary();
  const inputBaseName = path.parse(inputPath).name;

  await execFileAsync(libreOfficeBin, ["--headless", "--convert-to", "pdf", "--outdir", outputDir, inputPath], {
    timeout: 120000,
    maxBuffer: 10 * 1024 * 1024,
    env: {
      ...process.env,
      HOME: process.env.HOME || os.tmpdir(),
    },
  });

  const convertedPdfPath = path.join(outputDir, `${inputBaseName}.pdf`);

  if (!fs.existsSync(convertedPdfPath)) {
    throw new Error(`LibreOffice conversion succeeded but PDF not found at ${convertedPdfPath}`);
  }

  return convertedPdfPath;
};

const renderOfficeThumbnail = async (officePath: string): Promise<Buffer> => {
  const rawOfficeBuffer = fs.readFileSync(officePath);
  const decodedOfficeBuffer = decodePossiblyBase64Office(rawOfficeBuffer);

  if (decodedOfficeBuffer !== rawOfficeBuffer) {
    fs.writeFileSync(officePath, decodedOfficeBuffer);
  }

  const tempOutputDir = fs.mkdtempSync(path.join(os.tmpdir(), "office-thumbnail-"));

  try {
    const convertedPdfPath = await convertOfficeFileToPdf(officePath, tempOutputDir);
    return await renderPdfThumbnail(convertedPdfPath);
  } finally {
    fs.rmSync(tempOutputDir, { recursive: true, force: true });
  }
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
      try {
        thumbnailBuffer = await renderPdfThumbnail(tempInputPath);
      } catch (pdfError) {
        logger.warn(`[Thumbnail] Falling back for PDF ${fileMediaId}`, pdfError);
        thumbnailBuffer = await buildThumbnailPng("PDF");
      }
    } else if (DOC_EXTENSIONS.has(ext)) {
      try {
        thumbnailBuffer = await renderOfficeThumbnail(tempInputPath);
      } catch (officeError) {
        logger.warn(`[Thumbnail] Falling back for office file ${fileMediaId}`, officeError);
        thumbnailBuffer = await buildThumbnailPng(getMediaLabel(ext));
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
