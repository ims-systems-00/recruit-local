import { FileMediaRefDto, PostCreatorDto, PostResponseDto } from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Serializes a media ref. Reads come from an aggregation that populates
 * `banner` / `images` into FileMedia documents; a raw model document still
 * holds bare ObjectIds, which degrade to `{ _id }` so the shape stays stable.
 */
const toMedia = (v: unknown): FileMediaRefDto => {
  const isPopulated =
    typeof v === "object" && v !== null && typeof (v as { toHexString?: unknown }).toHexString !== "function";

  if (!isPopulated) return { _id: String(v) };

  const media = v as Record<string, unknown>;
  return { ...media, _id: String(media._id) } as FileMediaRefDto;
};

/**
 * Serializes the populated author (tenant or job profile). Both variants carry
 * `_id` and a `profileImage`; the seeker variant also carries populated
 * job-title documents. `type` is set by the aggregation and passes through.
 */
const toCreator = (v: unknown): PostCreatorDto => {
  const c = { ...(v as Record<string, unknown>) };

  if (has(c, "_id")) c._id = String(c._id);
  if (has(c, "profileImage")) c.profileImage = c.profileImage == null ? null : toMedia(c.profileImage);
  if (has(c, "jobTitle") && Array.isArray(c.jobTitle)) {
    c.jobTitle = c.jobTitle.map((title) => {
      const t = { ...(title as Record<string, unknown>) };
      if (has(t, "_id")) t._id = String(t._id);
      return t;
    });
  }

  // `type` is always set by the aggregation, but it is untyped coming out of a
  // plain document, so the discriminated union needs the widening cast.
  return c as unknown as PostCreatorDto;
};

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
  if (has(d, "creator")) d.creator = d.creator == null ? null : toCreator(d.creator);
  if (has(d, "jobProfileId")) d.jobProfileId = d.jobProfileId == null ? null : String(d.jobProfileId);
  if (has(d, "banner")) d.banner = d.banner == null ? null : toMedia(d.banner);
  if (has(d, "images") && Array.isArray(d.images)) d.images = d.images.map(toMedia);
  if (has(d, "schedule")) d.schedule = d.schedule == null ? null : toIso(d.schedule);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);

  return d as PostResponseDto;
};

export const toPostResponseList = (docs: unknown[]): PostResponseDto[] => docs.map(toPostResponse);
