import { ValueResponseDto } from "@rl/types";

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Serializes a populated value document (from `populateValuesQuery`) into its
 * public HTTP shape: ObjectId -> string id, exposing only the public value
 * fields and dropping internal bookkeeping (`__v`, `weight`, soft-delete
 * markers, timestamps). Falls back to a bare hex id string if a raw,
 * unpopulated ObjectId slips through.
 *
 * Shared by the tenant and job-profile read paths, which both `$lookup` their
 * `values` array into full value documents.
 */
export const toValueResponse = (v: unknown): ValueResponseDto | string => {
  if (!v || typeof v !== "object") return String(v);
  const val = v as Record<string, unknown>;
  // A raw, unpopulated ObjectId is also `typeof "object"` but carries none of a
  // value document's own fields — stringify it to its hex id instead.
  if (!has(val, "_id") && !has(val, "label")) return String(v);
  return {
    _id: String(val._id),
    type: val.type,
    label: val.label,
    isActive: val.isActive,
  } as ValueResponseDto;
};

/** Serializes an array that may hold populated value documents or raw ObjectIds. */
export const toValueResponseList = (values: unknown): (ValueResponseDto | string)[] =>
  Array.isArray(values) ? values.map(toValueResponse) : [];
