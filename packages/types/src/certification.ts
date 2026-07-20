/**
 * Public HTTP shape of a Certification.
 *
 * All fields are optional because certification responses are CASL
 * field-sanitized — a caller only receives the fields it is permitted to read.
 * Internal fields (deleteMarker, __v) are intentionally omitted. ObjectIds are
 * serialized to strings and dates to ISO.
 */
export interface CertificationResponseDto {
  _id?: string;
  id?: string;
  userId?: string;
  jobProfileId?: string | null;
  title?: string;
  issuingOrganization?: string;
  issueDate?: string; // ISO
  imageId?: string | null;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
