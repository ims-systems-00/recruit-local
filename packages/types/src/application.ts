import { VISIBILITY_ENUM } from './file-media';
import { QUERY_TYPE_ENUMS } from './job';

/** Public HTTP shape of a single answer to a job's additional query. */
export interface ApplicationAnswerResponseDto {
  queryId: string;
  answer: string | string[] | number | boolean;
  /**
   * Merged in from the job's matching additional query on single-application
   * reads. Absent when that query has since been removed from the job.
   */
  question?: string;
  type?: QUERY_TYPE_ENUMS;
  options?: string[];
  isRequired?: boolean;
  /** Employers only — stripped for candidates. */
  expectedAnswer?: string;
}

/** Populated job profile summary attached to an application response. */
export interface ApplicationJobProfileDto {
  _id: string;
  name?: string;
  email?: string;
}

/** Populated status summary attached to an application response. */
export interface ApplicationStatusDto {
  _id: string;
  label?: string;
}

/** Populated file media (resume / case study) attached to an application response. */
export interface ApplicationFileDto {
  _id: string;
  src?: string | null;
  visibility?: VISIBILITY_ENUM;
  storageInformation?: {
    Name?: string;
    Bucket?: string;
    Key?: string;
  };
  thumbnail?: {
    Name?: string;
    Bucket?: string;
    Key?: string;
  };
}

/**
 * Public HTTP shape of an Application.
 *
 * All fields are optional because application responses are CASL field-sanitized
 * — a caller only receives the fields it is permitted to read. Internal fields
 * (deleteMarker, __v) are intentionally omitted. ObjectIds are serialized to
 * strings and dates to ISO. Populated relations (status, jobProfile, resume,
 * caseStudies) are present only when the aggregation looked them up.
 */
export interface ApplicationResponseDto {
  _id?: string;
  id?: string;
  ID?: number;
  reference?: string | null;
  tenantId?: string | null;
  jobId?: string;
  jobProfileId?: string | null;
  statusId?: string | null;
  rank?: number;
  matchScore?: number;
  coverLetter?: string;
  resumeId?: string | null;
  caseStudyId?: string[];
  answers?: ApplicationAnswerResponseDto[];
  portfolioUrl?: string;
  currentSalary?: number;
  expectedSalary?: number;
  feedback?: string;
  appliedAt?: string; // ISO
  createdAt?: string; // ISO
  updatedAt?: string; // ISO

  // Populated relations (present only when looked up by the aggregation).
  status?: ApplicationStatusDto;
  jobProfile?: ApplicationJobProfileDto;
  resume?: ApplicationFileDto;
  caseStudies?: ApplicationFileDto[];
}

export type JobOverviewRange = 'week' | 'month';

/** One day of the overview trend: `new` applied that day, `total` is cumulative up to it. */
export interface JobOverviewDailyDto {
  date: string; // YYYY-MM-DD in the requested timezone
  total: number;
  new: number;
}

/** One board column of the job and how many applications currently sit in it. */
export interface JobOverviewStageDto {
  statusId: string;
  label: string;
  backgroundColor: string;
  count: number;
}

/** Applications bucketed by `matchScore` (out of 1000): strong >= 700, good 400-699, weak < 400. */
export interface JobOverviewMatchScoreDto {
  strong: number;
  good: number;
  weak: number;
}

/**
 * Public HTTP shape of `GET /applications/overview` — the recruiter's job
 * overview tab. `stages` / `matchScore` are null when the caller may not read
 * `statusId` / `matchScore`. A `*ChangePct` is null when the previous period is 0.
 */
export interface JobOverviewResponseDto {
  range: JobOverviewRange;
  periodStart: string; // ISO
  periodEnd: string; // ISO
  totals: {
    total: number;
    totalChangePct: number | null;
    newApplicants: number;
    newChangePct: number | null;
  };
  daily: JobOverviewDailyDto[];
  stages: JobOverviewStageDto[] | null;
  matchScore: JobOverviewMatchScoreDto | null;
}
