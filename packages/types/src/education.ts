export interface IEducation {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startDate: Date;
  endDate?: Date;
  description?: string;
  grade?: string;
}

/**
 * Public HTTP shape of an Education record.
 *
 * All fields are optional because education responses are CASL field-sanitized —
 * a caller only receives the fields it is permitted to read. Internal fields
 * (deleteMarker, __v) are intentionally omitted. ObjectIds are serialized to
 * strings and dates to ISO.
 */
export interface EducationResponseDto {
  _id?: string;
  id?: string;
  userId?: string;
  jobProfileId?: string | null;
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string; // ISO
  endDate?: string | null; // ISO
  description?: string;
  grade?: string;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
