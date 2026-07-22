import { PostResponseDto } from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Serializes a (possibly partial) sanitized post into its public HTTP shape.
 * CASL-sanitized fields the caller can't read stay absent. ObjectIds become
 * strings, dates become ISO strings, and internal bookkeeping fields are dropped.
 * Mirrors job.dto.ts::toJobResponse.
 */
export const toPostResponse = (doc: unknown): PostResponseDto => {
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
  if (has(d, "tenantId")) d.tenantId = d.tenantId == null ? null : String(d.tenantId);
  if (has(d, "jobProfileId")) d.jobProfileId = d.jobProfileId == null ? null : String(d.jobProfileId);
  if (has(d, "banner")) d.banner = d.banner == null ? null : String(d.banner);
  if (has(d, "images") && Array.isArray(d.images)) d.images = d.images.map(String);
  if (has(d, "schedule")) d.schedule = d.schedule == null ? null : toIso(d.schedule);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);

  return d as PostResponseDto;
};

export const toPostResponseList = (docs: unknown[]): PostResponseDto[] => docs.map(toPostResponse);
