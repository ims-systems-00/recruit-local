/**
 * Formats the extractor can pull text out of. DOCX is a zip of XML, so it needs
 * no system binary; .doc/.rtf would need LibreOffice, which is not in the
 * production image.
 */
export const RESUME_EXTENSION_PATTERN = /\.(pdf|docx)$/i;
export const RESUME_FORMAT_MESSAGE = "CV must be a PDF or Word (.docx) file.";

/**
 * The shape the extractor asks the model to fill. Sent as a user message
 * alongside the resume text, so it is data rather than instruction and stays
 * out of the prompt registry.
 */
export const CV_EXTRACTION_SCHEMA = {
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

/**
 * Fallback for `PROMPT_NAME.CV_EXTRACT_SYSTEM`.
 *
 * Kept in code, and kept correct, because the stored version is what normally
 * runs: this is what the extractor falls back to when the registry cannot
 * answer. It also seeds v1, so the database starts out saying exactly this.
 *
 * Lives in its own file rather than in the service so the seeder can import it
 * without constructing the service's OpenAI and S3 clients.
 */
export const DEFAULT_CV_EXTRACT_SYSTEM_PROMPT = `You are a resume data parser. Fill the provided JSON schema using information found in the resume text. Return ONLY the filled JSON object.

Field-specific rules:
- jobTitles: List all job titles found in the experience section (e.g. "Software Engineer", "Frontend Developer").
- industries: Infer the industry/sector from the companies and roles (e.g. "Information Technology", "Finance", "Healthcare"). Use broad industry names.
- workModes: Look for any mention of remote, hybrid, or onsite/office work in the experience descriptions or anywhere in the resume. Return matching terms as-is (e.g. "Remote", "Hybrid", "Onsite"). Return empty array if no mention found.
- experienceLevels: Calculate total years of professional experience from the experience section (treat "Present" as today). Then classify using these rules: 0–1 year → "Fresher"; 1–3 years → "Intermediate"; 3–7 years → "Expert"; 7+ years → "Lead". Return a single-element array with the matching level name.
- summary: If the resume has a summary, profile, objective or "about me" section, use that text, lightly cleaned up. Otherwise write 2–3 sentences in the candidate's voice (first person) from facts the resume states: their roles, years of experience and main skills. Never invent employers, numbers or achievements. Leave it empty only if the resume has no experience, education or skills at all.
- skills.name: The skill's common name only, without levels or years (e.g. "React", not "React (5 years)").
- skills.proficiencyLevel: Exactly one of "beginner", "intermediate" or "advanced". If the resume states a level, map it: "expert" or "proficient" → "advanced"; "basic" or "familiar" → "beginner". Otherwise estimate it from the experience section: used in a main role for 3+ years → "advanced"; used regularly for 1–3 years → "intermediate"; only mentioned or used briefly → "beginner". If there is nothing to go on, use "intermediate".
- summary is the only field you may compose. Never add skills, interests, jobs or education the resume does not mention.
- Leave a field as an empty string or empty array if the data cannot be determined.`;
