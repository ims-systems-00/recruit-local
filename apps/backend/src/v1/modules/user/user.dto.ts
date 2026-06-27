import { UserResponseDto } from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Serializes a (possibly partial) sanitized user into its public HTTP shape.
 * A field that was sanitized away stays absent. ObjectIds become strings, dates
 * become ISO strings, and internal/sensitive fields are dropped.
 */
export const toUserResponse = (doc: unknown): UserResponseDto => {
  // Guard against a raw Mongoose document being passed in: spreading one would
  // capture internal state (getters/setters, $__, version key) instead of data.
  const source = doc as { toObject?: () => Record<string, unknown> } | null | undefined;
  const d =
    source && typeof source.toObject === "function"
      ? source.toObject()
      : { ...((doc ?? {}) as Record<string, unknown>) };

  // Drop internal and sensitive fields that should never be exposed.
  delete d.__v;
  delete d.password;
  delete d.passwordChangeAt;
  delete d.deleteMarker;
  delete d.deletedAt;

  if (has(d, "_id")) d._id = String(d._id);
  if (has(d, "id")) d.id = String(d.id);
  if (has(d, "tenantId")) d.tenantId = d.tenantId == null ? null : String(d.tenantId);
  if (has(d, "jobProfileId")) d.jobProfileId = d.jobProfileId == null ? null : String(d.jobProfileId);
  if (has(d, "profileImageId")) d.profileImageId = d.profileImageId == null ? null : String(d.profileImageId);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);

  return d as UserResponseDto;
};

export const toUserResponseList = (docs: unknown[]): UserResponseDto[] => docs.map(toUserResponse);
