import { PromptResponseDto } from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Serializes a (possibly partial) sanitized prompt into its public HTTP shape.
 * A field the caller may not read stays absent. ObjectIds become strings, dates
 * become ISO strings, and internal bookkeeping fields are dropped.
 */
export const toPromptResponse = (doc: unknown): PromptResponseDto => {
  // Guard against a raw Mongoose document being passed in: spreading one would
  // capture internal state (getters/setters, $__, version key) instead of data.
  const source = doc as { toObject?: () => Record<string, unknown> } | null | undefined;
  const d =
    source && typeof source.toObject === "function"
      ? source.toObject()
      : { ...((doc ?? {}) as Record<string, unknown>) };

  delete d.__v;
  delete d.deleteMarker;

  if (has(d, "_id")) d._id = String(d._id);
  if (has(d, "id")) d.id = String(d.id);
  if (has(d, "createdBy")) d.createdBy = d.createdBy == null ? null : String(d.createdBy);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);

  return d as PromptResponseDto;
};

export const toPromptResponseList = (docs: unknown[]): PromptResponseDto[] => docs.map(toPromptResponse);
