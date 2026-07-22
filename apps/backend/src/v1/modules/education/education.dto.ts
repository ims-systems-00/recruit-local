import { EducationResponseDto } from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Serializes a (possibly partial) sanitized education record into its public
 * HTTP shape. A field that was sanitized away stays absent. ObjectIds become
 * strings, dates become ISO strings, and internal bookkeeping fields are dropped.
 */
export const toEducationResponse = (doc: unknown): EducationResponseDto => {
  // Guard against a raw Mongoose document being passed in: spreading one would
  // capture internal state (getters/setters, $__, version key) instead of data.
  const source = doc as { toObject?: () => Record<string, unknown> } | null | undefined;
  const d =
    source && typeof source.toObject === "function"
      ? source.toObject()
      : { ...((doc ?? {}) as Record<string, unknown>) };

  // Drop internal fields that should never be exposed.
  delete d.__v;
  delete d.deleteMarker;
  delete d.deletedAt;

  if (has(d, "_id")) d._id = String(d._id);
  if (has(d, "id")) d.id = String(d.id);
  if (has(d, "userId")) d.userId = d.userId == null ? null : String(d.userId);
  if (has(d, "jobProfileId")) d.jobProfileId = d.jobProfileId == null ? null : String(d.jobProfileId);
  if (has(d, "startDate")) d.startDate = d.startDate == null ? null : toIso(d.startDate);
  if (has(d, "endDate")) d.endDate = d.endDate == null ? null : toIso(d.endDate);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);

  return d as EducationResponseDto;
};

export const toEducationResponseList = (docs: unknown[]): EducationResponseDto[] => docs.map(toEducationResponse);
