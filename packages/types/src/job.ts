import {
  EMPLOYMENT_TYPE,
  PERIOD_ENUMS,
  REQUIRED_DOCUMENTS_ENUMS,
  WORKING_DAYS_ENUMS,
  WORKPLACE_ENUMS,
} from './enums';

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
  keywords?: string[];
  totalApplications?: number;
  boardBackground?: string;
  boardSortBy?: string;
  boardSortOrder?: 'asc' | 'desc';
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
