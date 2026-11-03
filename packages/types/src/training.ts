import { FileMediaRefDto } from './file-media';
import { NamedCatalogResponseDto } from './catalog';

/** Most skills one training may list. Shared so the form and the validator agree. */
export const TRAINING_SKILLS_MAX = 15;

// `skills` is left to the model: skill catalogue ObjectIds, populated on read.
export interface ITraining {
  organizationName: string;
  courseName: string;
  isCurrentlyEnrolled?: boolean;
  startDate: Date;
  // Absent while the candidate is still enrolled.
  endDate?: Date;
}

/**
 * Public HTTP shape of a Training record.
 *
 * All fields are optional because training responses are CASL field-sanitized —
 * a caller only receives the fields it is permitted to read. Internal fields
 * (deleteMarker, __v) are intentionally omitted. ObjectIds are serialized to
 * strings and dates to ISO. The `certificate` relation is present only when the
 * aggregation looked it up.
 */
export interface TrainingResponseDto {
  _id?: string;
  id?: string;
  userId?: string;
  jobProfileId?: string | null;
  organizationName?: string;
  courseName?: string;
  // Catalogue entries, in the order the candidate picked them.
  skills?: NamedCatalogResponseDto[];
  isCurrentlyEnrolled?: boolean;
  startDate?: string; // ISO
  endDate?: string | null; // ISO
  certificateId?: string | null;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO

  // Populated relation (present only when looked up by the aggregation).
  certificate?: FileMediaRefDto | null;
}
