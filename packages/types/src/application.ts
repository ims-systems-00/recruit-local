import { VISIBILITY_ENUM } from './file-media';

/** Public HTTP shape of a single answer to a job's additional query. */
export interface ApplicationAnswerResponseDto {
  queryId: string;
  answer: string | string[] | number | boolean;
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
