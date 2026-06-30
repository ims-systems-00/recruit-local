import { TenantResponseDto, TENANT_COMPLETION_SECTIONS } from "@rl/types";
import { expandCompletion } from "@rl/utils";
import { toValueResponse } from "../value/value.dto";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Serializes a (possibly partial) sanitized tenant into its public HTTP shape.
 * A field that was sanitized away stays absent. ObjectIds become strings, dates
 * become ISO strings, and internal bookkeeping fields are dropped.
 */
export const toTenantResponse = (doc: unknown): TenantResponseDto => {
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
  if (has(d, "values") && Array.isArray(d.values)) d.values = d.values.map(toValueResponse);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);

  // Expand the lean stored completion into the full breakdown (percentage +
  // labelled sections + missing) using the shared section config.
  if (has(d, "completion") && d.completion) {
    const stored = d.completion as { completeSections?: string[]; computedAt?: Date | string | null };
    d.completion = expandCompletion(TENANT_COMPLETION_SECTIONS, stored.completeSections ?? [], stored.computedAt ?? null);
  }

  return d as TenantResponseDto;
};

export const toTenantResponseList = (docs: unknown[]): TenantResponseDto[] => docs.map(toTenantResponse);
