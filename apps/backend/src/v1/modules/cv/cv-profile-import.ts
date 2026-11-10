import moment from "moment";
import { Types } from "mongoose";
import {
  EMPLOYMENT_TYPE,
  IEducation,
  IExperience,
  ITraining,
  JOB_SKILL_LEVEL_ENUMS,
  PROFILE_SKILLS_MAX,
} from "@rl/types";
import { Education, Experience, IProfileSkill, JobProfile, Training, normalizeSkillName } from "../../../models";
import { enqueueProfileCompletion } from "../../../queue/profileCompletionUpdateQueue";
import { enqueueProfileKeywords } from "../../../queue/keywordUpdateQueue";
import * as skillCatalogService from "../skill-catalog/skill-catalog.service";

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
  trainings: ITraining[];
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

/** Trimmed text, or undefined for anything that is not a non-blank string. */
export const asText = (value: unknown): string | undefined => {
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
  // Noon, not midnight: the page shows dates in the viewer's time zone, and noon
  // UTC is the same calendar day from UTC−11 to UTC+11. At midnight, "Jan 2021"
  // reads as Dec 31, 2020 anywhere west of UTC.
  return parsed.isValid() ? parsed.hour(12).toDate() : undefined;
};

// An end before the start is a misread; the row is kept without it. With no
// start there is nothing to compare, so the end stands.
const endAfter = (startDate: Date | undefined, endDate?: Date) =>
  endDate && (!startDate || endDate >= startDate) ? endDate : undefined;

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
  // Required by the Education model; a row without them would fail the save.
  if (!institution || !degree) return undefined;

  const startDate = parseDate(row.startDate);
  return {
    institution,
    degree,
    fieldOfStudy: asText(row.fieldOfStudy),
    startDate,
    // "Present" does not parse, so a course still running is left without an end.
    endDate: endAfter(startDate, parseDate(row.endDate)),
    grade: asText(row.grade),
  };
};

const toTraining = (row: Record<string, unknown>): ITraining | undefined => {
  const courseName = asText(row.courseName);
  const organizationName = asText(row.organizationName);
  const isCurrentlyEnrolled = PRESENT_PATTERN.test(asText(row.endDate) ?? "");
  const start = parseDate(row.startDate);
  const end = isCurrentlyEnrolled ? undefined : parseDate(row.endDate);
  // A course with one date is dated by it. The prompt puts that date in
  // startDate; this also takes it from endDate, should the model put it there.
  const startDate = start ?? end;
  // Required by the Training model; a row without them would fail the save.
  if (!courseName || !organizationName || !startDate) return undefined;

  return {
    courseName,
    organizationName,
    startDate,
    endDate: start ? endAfter(start, end) : undefined,
    isCurrentlyEnrolled,
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
  trainings: asRows(extracted.trainings)
    .map(toTraining)
    .filter((row): row is ITraining => !!row),
  skills: toSkills(extracted.skills),
  interests: toInterests(extracted.interests),
});

const NOT_DELETED = { "deleteMarker.status": { $ne: true } };

// Missing, null or blank text.
const BLANK_TEXT = { $not: /\S/ };

// Missing, null or an empty list. A profile still holding the old free-text
// skills string matches neither, so it is left alone.
const NO_SKILLS = { $or: [{ skills: null }, { skills: { $size: 0 } }] };

type ProfileOwner = { userId: Types.ObjectId; jobProfileId: Types.ObjectId };

/** A CV skill matched to its catalogue entry, in the shape a profile's skills are returned in. */
export interface MatchedCvSkill {
  skill: { _id: Types.ObjectId; name: string };
  level: JOB_SKILL_LEVEL_ENUMS;
}

/**
 * Only CV skills already in the catalogue: candidates cannot add entries. Kept
 * in the CV's order and cut to the profile's limit after matching, so a skill
 * the catalogue lacks never takes the place of one it has.
 */
export const matchCvSkills = async (skills: CvSkill[]): Promise<MatchedCvSkill[]> => {
  if (!skills.length) return [];
  const entries = await skillCatalogService.findActiveByNames(skills.map(({ name }) => name));
  const entryByName = new Map(entries.map((entry) => [entry.normalizedName, entry]));
  return skills
    .flatMap(({ name, level }) => {
      const entry = entryByName.get(normalizeSkillName(name));
      return entry ? [{ skill: { _id: entry._id, name: entry.name }, level }] : [];
    })
    .slice(0, PROFILE_SKILLS_MAX);
};

/**
 * Adds the CV's work experience, education and trainings, each only while the
 * candidate has none of that kind, so a second import adds nothing. Returns how
 * many rows of each were added.
 */
const importCvRecords = async ({
  userId,
  jobProfileId,
  data,
}: ProfileOwner & { data: Pick<CvProfileData, "experience" | "education" | "trainings"> }) => {
  const owner = { userId, jobProfileId };
  const [hasExperience, hasEducation, hasTraining] = await Promise.all([
    Experience.exists({ ...owner, ...NOT_DELETED }),
    Education.exists({ ...owner, ...NOT_DELETED }),
    Training.exists({ ...owner, ...NOT_DELETED }),
  ]);

  const [experience, education, training] = await Promise.all([
    data.experience.length && !hasExperience
      ? Experience.insertMany(data.experience.map((row) => ({ ...row, ...owner })))
      : [],
    data.education.length && !hasEducation
      ? Education.insertMany(data.education.map((row) => ({ ...row, ...owner })))
      : [],
    data.trainings.length && !hasTraining
      ? Training.insertMany(data.trainings.map((row) => ({ ...row, ...owner })))
      : [],
  ]);

  return { experience: experience.length, education: education.length, training: training.length };
};

/** A CV's work experience, education and training rows, by profile section. */
export interface CvRecords {
  experience: IExperience[];
  education: IEducation[];
  training: ITraining[];
}

// Ignoring case and spacing, so "ACME  Ltd" and "Acme Ltd" are one company.
const entryKey = (...parts: (string | undefined)[]) =>
  parts.map((part) => (part ?? "").trim().replace(/\s+/g, " ").toLowerCase()).join("|");

// What makes two rows the same entry. Dates are left out: a CV's "Mar 2021"
// and a hand-entered 14 March 2021 are the same job.
const experienceKey = (row: Partial<IExperience>) => entryKey(row.company, row.jobTitle);
const educationKey = (row: Partial<IEducation>) => entryKey(row.institution, row.degree);
const trainingKey = (row: Partial<ITraining>) => entryKey(row.courseName, row.organizationName);

/**
 * Splits a CV's rows into the ones the profile lacks and a count of the ones
 * it already has — same company and job title, institution and degree, or
 * course and organisation.
 */
export const findNewCvRecords = async (owner: ProfileOwner, records: CvRecords) => {
  const [experience, education, training] = await Promise.all([
    Experience.find({ ...owner, ...NOT_DELETED }, { company: 1, jobTitle: 1 }).lean(),
    Education.find({ ...owner, ...NOT_DELETED }, { institution: 1, degree: 1 }).lean(),
    Training.find({ ...owner, ...NOT_DELETED }, { courseName: 1, organizationName: 1 }).lean(),
  ]);
  const onProfile = {
    experience: new Set(experience.map(experienceKey)),
    education: new Set(education.map(educationKey)),
    training: new Set(training.map(trainingKey)),
  };

  const fresh: CvRecords = {
    experience: records.experience.filter((row) => !onProfile.experience.has(experienceKey(row))),
    education: records.education.filter((row) => !onProfile.education.has(educationKey(row))),
    training: records.training.filter((row) => !onProfile.training.has(trainingKey(row))),
  };

  return {
    records: fresh,
    alreadyOnProfile: {
      experience: records.experience.length - fresh.experience.length,
      education: records.education.length - fresh.education.length,
      training: records.training.length - fresh.training.length,
    },
  };
};

/**
 * Saves the CV rows the candidate ticked, leaving out any the profile already
 * has, so a retry or a second import never adds an entry twice. Existing rows
 * are never changed. Returns how many of each were saved.
 */
export const addCvRecords = async (owner: ProfileOwner, records: CvRecords) => {
  const { records: fresh } = await findNewCvRecords(owner, records);
  const withOwner = <T>(rows: T[]) => rows.map((row) => ({ ...row, ...owner }));

  const [experience, education, training] = await Promise.all([
    fresh.experience.length ? Experience.insertMany(withOwner(fresh.experience)) : [],
    fresh.education.length ? Education.insertMany(withOwner(fresh.education)) : [],
    fresh.training.length ? Training.insertMany(withOwner(fresh.training)) : [],
  ]);
  const added = { experience: experience.length, education: education.length, training: training.length };

  // Once for the whole save, rather than once per row as the row services do.
  if (Object.values(added).some(Boolean)) await enqueueProfileCompletion(owner.userId);
  return added;
};

/**
 * Fills the profile's empty sections from a CV, never overwriting what the
 * candidate already has. Each section is filled only while it is empty, so a
 * second upload adds nothing and a retry after a partial failure fills only
 * what is still missing.
 */
export const importCvIntoProfile = async ({ userId, jobProfileId, data }: ProfileOwner & { data: CvProfileData }) => {
  // The emptiness check sits in the filter, so it and the write are one step.
  const fillProfile = (empty: object, set: object) =>
    JobProfile.updateOne({ _id: jobProfileId, userId, ...empty }, { $set: set });

  const skills: IProfileSkill[] = (await matchCvSkills(data.skills)).map(({ skill, level }) => ({
    skill: skill._id,
    level,
  }));

  const [summaryResult, skillsResult, interestsResult, rows] = await Promise.all([
    data.summary ? fillProfile({ summary: BLANK_TEXT }, { summary: data.summary }) : null,
    skills.length ? fillProfile(NO_SKILLS, { skills }) : null,
    data.interests ? fillProfile({ interests: BLANK_TEXT }, { interests: data.interests }) : null,
    importCvRecords({ userId, jobProfileId, data }),
  ]);

  const imported = {
    summary: !!summaryResult?.modifiedCount,
    experience: rows.experience,
    education: rows.education,
    training: rows.training,
    skills: skillsResult?.modifiedCount ? skills.length : 0,
    interests: !!interestsResult?.modifiedCount,
  };

  // Once for the whole import, rather than once per row as the row services do.
  if (Object.values(imported).some(Boolean)) await enqueueProfileCompletion(userId);
  // Match keywords are built from a profile's skills and interests, among others.
  if (imported.skills || imported.interests) await enqueueProfileKeywords(jobProfileId);

  return imported;
};
