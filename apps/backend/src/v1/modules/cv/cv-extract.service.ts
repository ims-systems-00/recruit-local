import OpenAI from "openai";
import { PROMPT_NAME } from "@rl/types";
import { FileManager } from "../../../common/helper/file-manager";
import { s3Client } from "../../../.config/s3.config";
import { BadRequestException, logger } from "../../../common/helper";
import { resolvePrompt } from "../prompt/prompt.resolver";
import { CV_EXTRACTION_SCHEMA, DEFAULT_CV_EXTRACT_SYSTEM_PROMPT, RESUME_FORMAT_MESSAGE } from "./cv.constants";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 90_000,
});

const PDF_MAGIC = "%PDF-";
const ZIP_MAGIC = "504b0304"; // PK\x03\x04 — a .docx is a zip

function decodePossiblyBase64Pdf(buffer: Buffer): Buffer {
  if (!buffer.subarray(0, 32).toString("utf-8").startsWith("JVBER")) return buffer;
  const decoded = Buffer.from(buffer.toString("utf-8").replace(/\s+/g, ""), "base64");
  return decoded.subarray(0, 5).toString("utf-8") === PDF_MAGIC ? decoded : buffer;
}

function decodePossiblyBase64Docx(buffer: Buffer): Buffer {
  if (!buffer.subarray(0, 32).toString("utf-8").startsWith("UEsDB")) return buffer;
  const decoded = Buffer.from(buffer.toString("utf-8").replace(/\s+/g, ""), "base64");
  return decoded.subarray(0, 4).toString("hex") === ZIP_MAGIC ? decoded : buffer;
}

/**
 * Dispatch on the bytes, not the filename — S3 accepts whatever the client
 * named the object, so `cv.pdf` may well be a Word file.
 */
async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  const pdf = decodePossiblyBase64Pdf(buffer);
  if (pdf.subarray(0, 5).toString("utf-8") === PDF_MAGIC) {
    return (await pdfParse(pdf)).text;
  }

  const docx = decodePossiblyBase64Docx(buffer);
  if (docx.subarray(0, 4).toString("hex") === ZIP_MAGIC) {
    return (await mammoth.extractRawText({ buffer: docx })).value;
  }

  logger.warn("[extractFromResume] Unrecognised resume format", {
    firstBytesHex: buffer.subarray(0, 8).toString("hex"),
  });
  throw new BadRequestException(RESUME_FORMAT_MESSAGE);
}

async function fillSchemaWithAI(resumeText: string): Promise<object> {
  // Resolved per call rather than at module load, so a prompt revision takes
  // effect without a restart. Falls back to the constant if the registry cannot
  // answer, so extraction never fails on a prompt lookup.
  const systemPrompt = await resolvePrompt(PROMPT_NAME.CV_EXTRACT_SYSTEM, {
    fallback: DEFAULT_CV_EXTRACT_SYSTEM_PROMPT,
  });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: systemPrompt.content },
      {
        role: "user",
        content: `Resume:\n${resumeText}\n\nSchema to fill:\n${JSON.stringify(CV_EXTRACTION_SCHEMA)}`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!);
}

const S3_TIMEOUT_MS = 30_000;

export async function extractFromResume({
  resumeStorage,
}: {
  resumeStorage: { Key: string; Bucket: string };
}): Promise<object> {
  const fileManager = new FileManager(s3Client);

  logger.info("[extractFromResume] Downloading resume from S3", {
    Bucket: resumeStorage.Bucket,
    Key: resumeStorage.Key,
  });
  const bufferPromise = fileManager.getFileAsBuffer({ Bucket: resumeStorage.Bucket, Key: resumeStorage.Key });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("S3 download timed out after 30 s")), S3_TIMEOUT_MS)
  );
  const buffer = await Promise.race([bufferPromise, timeoutPromise]);

  logger.info("[extractFromResume] Extracting text from resume");
  const resumeText = await extractTextFromBuffer(buffer);
  logger.info("[extractFromResume] Extracted text, sending to OpenAI", { chars: resumeText.length });

  const result = await fillSchemaWithAI(resumeText);
  logger.info("[extractFromResume] OpenAI fill complete");

  return result;
}
