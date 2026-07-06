/**
 * Public HTTP shape of a populated catalog reference (JobTitle / Industry /
 * WorkMode) embedded in a parent document, e.g. a job profile's `jobTitle`,
 * `industry`, or `workMode`. ObjectId is a string; internal bookkeeping fields
 * (`__v`, soft-delete markers, timestamps) are dropped.
 */
export interface NamedCatalogResponseDto {
  _id: string;
  name: string;
  description?: string;
  isActive?: boolean;
}
