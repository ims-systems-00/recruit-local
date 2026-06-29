import { VISIBILITY_ENUM } from './file-media';
import { ISkill } from './skill';
import { IInterest } from './interest';

export enum CV_STATUS_ENUM {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

/** Public HTTP shape of a CV experience entry (dates serialized to ISO). */
export interface CvExperienceResponseDto {
  _id?: string;
  company: string;
  location?: string;
  workplace?: string;
  employmentType?: string;
  jobTitle: string;
  startDate?: string; // ISO
  endDate?: string | null; // ISO
  description?: string;
  isActive?: boolean;
}

/** Public HTTP shape of a CV education entry (dates serialized to ISO). */
export interface CvEducationResponseDto {
  _id?: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate?: string; // ISO
  endDate?: string | null; // ISO
  description?: string;
  grade?: string;
}

/** Public HTTP shape of a CV skill entry. */
export interface CvSkillResponseDto extends ISkill {
  _id?: string;
}

/** Public HTTP shape of a CV interest entry. */
export interface CvInterestResponseDto extends IInterest {
  _id?: string;
}

/** Populated file media (resume) attached to a CV response. */
export interface CvFileDto {
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
 * Public HTTP shape of a CV.
 *
 * All fields are optional because CV responses are CASL field-sanitized — a
 * caller only receives the fields it is permitted to read. Internal fields
 * (deleteMarker, __v) are intentionally omitted. ObjectIds are serialized to
 * strings and dates to ISO. The `resume` relation is present only when the
 * aggregation looked it up.
 */
export interface CvResponseDto {
  _id?: string;
  id?: string;
  userId?: string;
  jobProfileId?: string | null;
  title?: string;
  summary?: string;
  experience?: CvExperienceResponseDto[];
  education?: CvEducationResponseDto[];
  skills?: CvSkillResponseDto[];
  interests?: CvInterestResponseDto[];
  name?: string;
  imageId?: string | null;
  email?: string;
  phone?: string;
  address?: string;
  templateId?: string;
  colorProfile?: string;
  status?: CV_STATUS_ENUM;
  resumeId?: string | null;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO

  // Populated relation (present only when looked up by the aggregation).
  resume?: CvFileDto;
}
