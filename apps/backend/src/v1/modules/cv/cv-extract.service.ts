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

const CV_EXTRACTION_SCHEMA = {
  name: "",
  email: "",
  phone: "",
  address: "",
  summary: "",
  jobTitles: [],
  industries: [],
  workModes: [],
  experienceLevels: [],
  skills: [{ name: "", proficiencyLevel: "" }],
  experience: [
    {
      jobTitle: "",
      company: "",
      location: "",
      employmentType: "",
      startDate: "",
      endDate: "",
      description: "",
    },
  ],
  education: [
    {
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      grade: "",
    },
  ],
  interests: [{ name: "" }],
};

const SYSTEM_PROMPT = `You are a resume data parser. Fill the provided JSON schema using information found in the resume text. Return ONLY the filled JSON object.

Field-specific rules:
- jobTitles: List all job titles found in the experience section (e.g. "Software Engineer", "Frontend Developer").
- industries: Infer the industry/sector from the companies and roles (e.g. "Information Technology", "Finance", "Healthcare"). Use broad industry names.
- workModes: Look for any mention of remote, hybrid, or onsite/office work in the experience descriptions or anywhere in the resume. Return matching terms as-is (e.g. "Remote", "Hybrid", "Onsite"). Return empty array if no mention found.
- experienceLevels: Calculate total years of professional experience from the experience section (treat "Present" as today). Then classify using these rules: 0–1 year → "Fresher"; 1–3 years → "Intermediate"; 3–7 years → "Expert"; 7+ years → "Lead". Return a single-element array with the matching level name.
- Leave a field as an empty string or empty array if the data cannot be determined.`;

async function fillSchemaWithAI(resumeText: string): Promise<object> {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
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

  logger.info("[extractFromResume] Extracting text from PDF");
  const resumeText = await extractTextFromBuffer(buffer);
  logger.info("[extractFromResume] Extracted text, sending to OpenAI", { chars: resumeText.length });

  const result = await fillSchemaWithAI(resumeText);
  logger.info("[extractFromResume] OpenAI fill complete");

  return result;
}
