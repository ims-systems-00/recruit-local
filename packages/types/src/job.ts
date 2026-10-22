import {
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
  WORKING_DAYS_ENUMS,
  WORKPLACE_ENUMS,
} from './enums';
import { NamedCatalogResponseDto } from './catalog';
import { ValueResponseDto } from './value';

export type SalaryFixed = {
  mode: 'fixed';
  amount: number;
};

export type SalaryRange = {
  mode: 'range';
  min: number;
  max: number;
};
export type SalaryNegotiable = {
  mode: 'negotiable';
};

export type Salary = SalaryFixed | SalaryRange | SalaryNegotiable;

export type Education = {
  degree: string;
  fieldOfStudy: string;
  gpa?: string;
};

export type Skill = {
  name: string;
  years: number;
};

export type WorkingHours = {
  startTime: string; // "09:00"
  endTime: string; // "17:00"
};

export enum JOBS_STATUS_ENUMS {
  DRAFT = 'draft',
  OPEN = 'open',
  EVALUATION = 'evaluation',
  ARCHIVED = 'archived',
  CLOSED = 'closed',
}

export enum QUERY_TYPE_ENUMS {
  PARAGRAPH = 'paragraph',
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  SHORT_ANSWER = 'short_answer',
}

/** Public HTTP shape of an additional application query. */
export interface AdditionalQueryResponseDto {
  _id?: string;
  question: string;
  type: QUERY_TYPE_ENUMS;
  options?: string[];
  isRequired: boolean;
  expectedAnswer?: string;
}

/** How much of a skill a job asks for. Declared lowest to highest. */
export enum JOB_SKILL_LEVEL_ENUMS {
  WILLING_TO_LEARN = 'willing-to-learn',
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

/** Whether a candidate must have the skill, or it only counts in their favour. */
export enum JOB_SKILL_REQUIREMENT_ENUMS {
  REQUIRED = 'required',
  PREFERRED = 'preferred',
}

/** Display text for each skill level, as the job form shows it. */
export const JOB_SKILL_LEVEL_LABELS: Record<JOB_SKILL_LEVEL_ENUMS, string> = {
  [JOB_SKILL_LEVEL_ENUMS.WILLING_TO_LEARN]: 'Willing to Learn',
  [JOB_SKILL_LEVEL_ENUMS.BEGINNER]: 'Beginner',
  [JOB_SKILL_LEVEL_ENUMS.INTERMEDIATE]: 'Intermediate',
  [JOB_SKILL_LEVEL_ENUMS.ADVANCED]: 'Advance',
};

/** Display text for each skill requirement, as the job form shows it. */
export const JOB_SKILL_REQUIREMENT_LABELS: Record<
  JOB_SKILL_REQUIREMENT_ENUMS,
  string
> = {
  [JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED]: 'Required',
  [JOB_SKILL_REQUIREMENT_ENUMS.PREFERRED]: 'Preferred',
};

/** Most skills one job may list. Shared so the form and the validator agree. */
export const JOB_SKILLS_MAX = 20;

/** Public HTTP shape of one of a job's skills, with the catalogue entry populated. */
export interface JobSkillResponseDto {
  skill: NamedCatalogResponseDto;
  level: JOB_SKILL_LEVEL_ENUMS;
  requirement: JOB_SKILL_REQUIREMENT_ENUMS;
}

/**
 * How much a value matters to a job. An absolute tier, not a position: values
 * may share a tier, and it applies across every value type, not within one.
 */
export enum JOB_VALUE_PRIORITY_ENUMS {
  ESSENTIAL = 'essential',
  HIGHLY_IMPORTANT = 'highly-important',
  IMPORTANT = 'important',
  DESIRABLE = 'desirable',
}

/**
 * Multiplier each tier carries when a candidate's value scores are weighted
 * against a job. Derived on read, never stored, so changing a weight here
 * re-weights every job at once.
 */
export const JOB_VALUE_PRIORITY_WEIGHT: Record<
  JOB_VALUE_PRIORITY_ENUMS,
  number
> = {
  [JOB_VALUE_PRIORITY_ENUMS.ESSENTIAL]: 4,
  [JOB_VALUE_PRIORITY_ENUMS.HIGHLY_IMPORTANT]: 3,
  [JOB_VALUE_PRIORITY_ENUMS.IMPORTANT]: 2,
  [JOB_VALUE_PRIORITY_ENUMS.DESIRABLE]: 1,
};

/** Display text for each priority tier, as the job form shows it. */
export const JOB_VALUE_PRIORITY_LABELS: Record<
  JOB_VALUE_PRIORITY_ENUMS,
  string
> = {
  [JOB_VALUE_PRIORITY_ENUMS.ESSENTIAL]: 'Essentials',
  [JOB_VALUE_PRIORITY_ENUMS.HIGHLY_IMPORTANT]: 'Highly Important',
  [JOB_VALUE_PRIORITY_ENUMS.IMPORTANT]: 'Important',
  [JOB_VALUE_PRIORITY_ENUMS.DESIRABLE]: 'Desirable',
};

/**
 * Most values one job may list, across all value types. Set to the per-type cap
 * times the five types, so in practice only `JOB_VALUES_MAX_PER_TYPE` limits a
 * job — matching the form, which counts values per category.
 */
export const JOB_VALUES_MAX_TOTAL = 25;

/** Most values one job may list from a single value type (`VALUE_TYPE_ENUM`). */
export const JOB_VALUES_MAX_PER_TYPE = 5;

/**
 * Public HTTP shape of one of a job's values, with the value populated.
 *
 * `priority` and `weight` are the employer's ranking: present for the job's own
 * employer, absent for candidates and on the public job page.
 */
export interface JobValueResponseDto {
  value: ValueResponseDto;
  priority?: JOB_VALUE_PRIORITY_ENUMS;
  /** From `JOB_VALUE_PRIORITY_WEIGHT[priority]`; absent whenever `priority` is. */
  weight?: number;
}

/** The parts a candidate's match against a job is scored on. */
export enum JOB_MATCH_PART_ENUMS {
  SKILLS = 'skills',
  VALUES = 'values',
  /** Whether the job is the kind of role the candidate is after. */
  ROLE = 'role',
  LOCATION = 'location',
}

/**
 * Weight of each part in a job's `matchPercentage`, out of 100. Every part
 * always counts at its full weight: one with nothing to compare, on either side
 * (a job with no skills, a candidate with no work mode), scores 0.
 */
export const JOB_MATCH_WEIGHTS: Record<JOB_MATCH_PART_ENUMS, number> = {
  [JOB_MATCH_PART_ENUMS.SKILLS]: 35,
  [JOB_MATCH_PART_ENUMS.VALUES]: 35,
  [JOB_MATCH_PART_ENUMS.ROLE]: 15,
  [JOB_MATCH_PART_ENUMS.LOCATION]: 15,
};

/**
 * Public HTTP shape of a Job.
 *
 * All fields are optional because job responses are CASL field-sanitized — a
 * caller only receives the fields it is permitted to read (or, for public
 * endpoints, the whitelisted subset). Internal fields (deleteMarker, __v) are
 * intentionally omitted. ObjectIds are serialized to strings and dates to ISO.
 */
export interface JobResponseDto {
  _id?: string;
  id?: string;
  ID?: number;
  reference?: string | null;
  tenantId?: string | null;
  title?: string;
  description?: string;
  responsibility?: string;
  email?: string;
  number?: string;
  aboutUs?: string;
  endDate?: string | null; // ISO
  yearOfExperience?: number;
  attachmentIds?: string[];
  category?: string;
  vacancy?: number;
  location?: string;
  locationAdditionalInfo?: string;
  workplace?: WORKPLACE_ENUMS;
  workingDays?: number;
  weekends?: WORKING_DAYS_ENUMS[];
  workingHours?: WorkingHours;
  employmentType?: EMPLOYMENT_TYPE;
  salary?: number;
  period?: PERIOD_ENUMS;
  requiredDocuments?: REQUIRED_DOCUMENTS_ENUMS[];
  status?: JOBS_STATUS_ENUMS;
  formId?: string | null;
  additionalQueries?: AdditionalQueryResponseDto[];
  skills?: JobSkillResponseDto[];
  values?: JobValueResponseDto[];
  keywords?: string[];
  totalApplications?: number;
  boardBackground?: string;
  boardSortBy?: string;
  boardSortOrder?: 'asc' | 'desc';
  /** Whether the viewer has favourited (saved) this job. */
  alreadySaved?: boolean;
  /**
   * Id of that favourite, for undo via `DELETE /favourites/:id/soft`. `null`
   * when `alreadySaved` is false. Mirrors `PostResponseDto`.
   */
  alreadySavedId?: string | null;
  /**
   * How well the viewer's job profile fits this job, 0-100, weighted by
   * `JOB_MATCH_WEIGHTS`. Only on the job list, and only for a viewer with a job
   * profile. `null` while the profile has no skills, values or work modes yet.
   */
  matchPercentage?: number | null;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
