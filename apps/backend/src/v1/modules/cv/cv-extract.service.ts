import OpenAI from "openai";
import { FileManager } from "../../../common/helper/file-manager";
import { s3Client } from "../../../.config/s3.config";
import { logger } from "../../../common/helper";
import pdfParse from "pdf-parse";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  timeout: 90_000,
});

function decodePossiblyBase64Pdf(buffer: Buffer): Buffer {
  if (!buffer.subarray(0, 32).toString("utf-8").startsWith("JVBER")) return buffer;
  const decoded = Buffer.from(buffer.toString("utf-8").replace(/\s+/g, ""), "base64");
  return decoded.subarray(0, 5).toString("utf-8") === "%PDF-" ? decoded : buffer;
}

async function extractTextFromBuffer(buffer: Buffer): Promise<string> {
  const data = await pdfParse(decodePossiblyBase64Pdf(buffer));
  return data.text;
}

async function fillSchemaWithAI(resumeText: string, schema: object): Promise<object> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a resume data parser. Fill the provided JSON schema using only " +
          "information found in the resume text. Return ONLY the filled JSON object. " +
          "Leave a field as an empty string or empty array if the data is not present in the resume.",
      },
      {
        role: "user",
        content: `Resume:\n${resumeText}\n\nSchema to fill:\n${JSON.stringify(schema)}`,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content!);
}

const S3_TIMEOUT_MS = 30_000;

export async function extractFromResume({
  resumeStorage,
  schema,
}: {
  resumeStorage: { Key: string; Bucket: string };
  schema: object;
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

  logger.info("[extractFromResume] Extracting text from PDF");
  const resumeText = await extractTextFromBuffer(buffer);
  logger.info("[extractFromResume] Extracted text, sending to OpenAI", { chars: resumeText.length });

  const result = await fillSchemaWithAI(resumeText, schema);
  logger.info("[extractFromResume] OpenAI fill complete");

  return result;
}
