import moment from "moment";
import { Types } from "mongoose";
import { EMPLOYMENT_TYPE, IEducation, IExperience, JOB_SKILL_LEVEL_ENUMS } from "@rl/types";
import { Education, Experience, JobProfile, normalizeSkillName } from "../../../models";
import { enqueueProfileCompletion } from "../../../queue/profileCompletionUpdateQueue";

/** A skill as the CV names it, matched to a catalogue entry by name when saved. */
export interface CvSkill {
  name: string;
  level: JOB_SKILL_LEVEL_ENUMS;
}

/**
 * The parts of an extracted CV that belong on the candidate's profile, in the
 * shape the Experience and Education models accept. The extractor returns
 * whatever the model wrote, so every field is checked here rather than trusted.
 */
export interface CvProfileData {
  summary?: string;
  experience: IExperience[];
  education: IEducation[];
  skills: CvSkill[];
  interests?: string;
}

// Parsed strictly, so "Spring 2020" is dropped rather than guessed at. No
// day-level slash formats: "03/04/2020" could be either day or month first.
const DATE_FORMATS = ["YYYY-MM-DD", "YYYY-MM", "YYYY/MM", "MM/YYYY", "M/YYYY", "MMM YYYY", "MMMM YYYY", "YYYY"];

const PRESENT_PATTERN = /^(present|current|currently|now|ongoing|to date|till date)$/i;

// Keyed with hyphens and spaces removed, so "Full Time" and "full-time" land on the same entry.
const EMPLOYMENT_TYPE_ALIASES: Record<string, EMPLOYMENT_TYPE> = {
  fulltime: EMPLOYMENT_TYPE.FULL_TIME,
  parttime: EMPLOYMENT_TYPE.PART_TIME,
  contract: EMPLOYMENT_TYPE.CONTRACT,
  contractor: EMPLOYMENT_TYPE.CONTRACT,
  freelance: EMPLOYMENT_TYPE.FREELANCE,
  freelancer: EMPLOYMENT_TYPE.FREELANCE,
  intern: EMPLOYMENT_TYPE.INTERN,
  internship: EMPLOYMENT_TYPE.INTERN,
};

// The prompt asks for the catalogue's own words; the rest catch a level the CV
// states itself and the model passes through. Anything else is intermediate.
const SKILL_LEVEL_ALIASES: Record<string, JOB_SKILL_LEVEL_ENUMS> = {
  beginner: JOB_SKILL_LEVEL_ENUMS.BEGINNER,
  basic: JOB_SKILL_LEVEL_ENUMS.BEGINNER,
  elementary: JOB_SKILL_LEVEL_ENUMS.BEGINNER,
  familiar: JOB_SKILL_LEVEL_ENUMS.BEGINNER,
  novice: JOB_SKILL_LEVEL_ENUMS.BEGINNER,
  intermediate: JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE,
  competent: JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE,
  good: JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE,
  moderate: JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE,
  advanced: JOB_SKILL_LEVEL_ENUMS.ADVANCED,
  expert: JOB_SKILL_LEVEL_ENUMS.ADVANCED,
  fluent: JOB_SKILL_LEVEL_ENUMS.ADVANCED,
  native: JOB_SKILL_LEVEL_ENUMS.ADVANCED,
  proficient: JOB_SKILL_LEVEL_ENUMS.ADVANCED,
};

// The enum is declared lowest to highest, so its order ranks the levels.
const SKILL_LEVEL_ORDER = Object.values(JOB_SKILL_LEVEL_ENUMS);

// The most Alice may write into the field, which is the only limit it has.
const INTERESTS_MAX_CHARS = 1000;

const asText = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
};

const asRows = (value: unknown): Record<string, unknown>[] =>
  Array.isArray(value) ? value.filter((row): row is Record<string, unknown> => !!row && typeof row === "object") : [];

// A bare "React" counts the same as { name: "React" }.
const asNamedRows = (value: unknown) =>
  asRows(Array.isArray(value) ? value.map((item) => (typeof item === "string" ? { name: item } : item)) : value);

const parseDate = (value: unknown): Date | undefined => {
  const text = asText(value)
    ?.replace(/[.,]/g, "")
    .replace(/^sept\b/i, "Sep")
    .replace(/\s+/g, " ");
  if (!text) return undefined;
  const parsed = moment.utc(text, DATE_FORMATS, true);
  return parsed.isValid() ? parsed.toDate() : undefined;
};

// An end before the start is a misread; the row is kept without it.
const endAfter = (startDate: Date, endDate?: Date) => (endDate && endDate >= startDate ? endDate : undefined);

const parseEmploymentType = (value: unknown): EMPLOYMENT_TYPE | undefined => {
  const key = asText(value)
    ?.toLowerCase()
    .replace(/[\s_-]+/g, "");
  return key ? EMPLOYMENT_TYPE_ALIASES[key] : undefined;
};

const toExperience = (row: Record<string, unknown>): IExperience | undefined => {
  const company = asText(row.company);
  const jobTitle = asText(row.jobTitle);
  const startDate = parseDate(row.startDate);
  // Required by the Experience model; a row without them would fail the save.
  if (!company || !jobTitle || !startDate) return undefined;

  const isActive = PRESENT_PATTERN.test(asText(row.endDate) ?? "");
  return {
    company,
    jobTitle,
    startDate,
    endDate: isActive ? undefined : endAfter(startDate, parseDate(row.endDate)),
    isActive,
    location: asText(row.location),
    employmentType: parseEmploymentType(row.employmentType),
    description: asText(row.description),
  };
};

const toEducation = (row: Record<string, unknown>): IEducation | undefined => {
  const institution = asText(row.institution);
  const degree = asText(row.degree);
  const fieldOfStudy = asText(row.fieldOfStudy);
  const startDate = parseDate(row.startDate);
  // Required by the Education model; a row without them would fail the save.
  if (!institution || !degree || !fieldOfStudy || !startDate) return undefined;

  return {
    institution,
    degree,
    fieldOfStudy,
    startDate,
    // "Present" does not parse, so a course still running is left without an end.
    endDate: endAfter(startDate, parseDate(row.endDate)),
    grade: asText(row.grade),
  };
};

const parseSkillLevel = (value: unknown): JOB_SKILL_LEVEL_ENUMS =>
  SKILL_LEVEL_ALIASES[asText(value)?.toLowerCase() ?? ""] ?? JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE;

const toSkills = (value: unknown): CvSkill[] => {
  const byName = new Map<string, CvSkill>();
  for (const row of asNamedRows(value)) {
    // "React (5 years)" -> "React": the prompt asks for bare names, this catches the rest.
    const name = asText(row.name)?.replace(/\s*\([^)]*\)$/, "");
    if (!name) continue;

    const level = parseSkillLevel(row.proficiencyLevel);
    const key = normalizeSkillName(name);
    const seen = byName.get(key);
    // Listed twice, say under "Languages" and "Tools": the higher level wins.
    if (!seen || SKILL_LEVEL_ORDER.indexOf(level) > SKILL_LEVEL_ORDER.indexOf(seen.level)) {
      byName.set(key, { name: seen?.name ?? name, level });
    }
  }
  return [...byName.values()];
};

const toInterests = (value: unknown): string | undefined => {
  const seen = new Set<string>();
  let joined = "";
  for (const row of asNamedRows(value)) {
    const name = asText(row.name);
    if (!name || seen.has(name.toLowerCase())) continue;

    const next = joined ? `${joined}, ${name}` : name;
    // Whole items only: the first one that would run past the limit ends the list.
    if (next.length > INTERESTS_MAX_CHARS) break;
    seen.add(name.toLowerCase());
    joined = next;
  }
  return joined || undefined;
};

export const normalizeCvForProfile = (extracted: Record<string, unknown>): CvProfileData => ({
  summary: asText(extracted.summary),
  experience: asRows(extracted.experience)
    .map(toExperience)
    .filter((row): row is IExperience => !!row),
  education: asRows(extracted.education)
    .map(toEducation)
    .filter((row): row is IEducation => !!row),
  skills: toSkills(extracted.skills),
  interests: toInterests(extracted.interests),
});

const NOT_DELETED = { "deleteMarker.status": { $ne: true } };

/**
 * Fills the profile's empty sections from a CV, never overwriting what the
 * candidate already has. Each section is filled only while it is empty, so a
 * second upload adds nothing and a retry after a partial failure fills only
 * what is still missing.
 */
export const importCvIntoProfile = async ({
  userId,
  jobProfileId,
  data,
}: {
  userId: Types.ObjectId;
  jobProfileId: Types.ObjectId;
  data: CvProfileData;
}) => {
  const owner = { userId, jobProfileId };

  const [summaryResult, hasExperience, hasEducation] = await Promise.all([
    data.summary
      ? JobProfile.updateOne(
          // `$not: /\S/` matches a summary that is missing, null or blank.
          { _id: jobProfileId, userId, summary: { $not: /\S/ } },
          { $set: { summary: data.summary } }
        )
      : null,
    Experience.exists({ ...owner, ...NOT_DELETED }),
    Education.exists({ ...owner, ...NOT_DELETED }),
  ]);

  const [experience, education] = await Promise.all([
    data.experience.length && !hasExperience
      ? Experience.insertMany(data.experience.map((row) => ({ ...row, ...owner })))
      : [],
    data.education.length && !hasEducation
      ? Education.insertMany(data.education.map((row) => ({ ...row, ...owner })))
      : [],
  ]);

  const imported = {
    summary: !!summaryResult?.modifiedCount,
    experience: experience.length,
    education: education.length,
  };

  // Once for the whole import, rather than once per row as the row services do.
  if (imported.summary || imported.experience || imported.education) await enqueueProfileCompletion(userId);

  return imported;
};
