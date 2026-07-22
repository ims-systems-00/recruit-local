import { NamedCatalogResponseDto } from "@rl/types";

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * Serializes a populated catalog document (JobTitle / Industry / WorkMode, from
 * `populateNamedRefQuery`) into its public HTTP shape: ObjectId -> string id,
 * exposing only the public catalog fields and dropping internal bookkeeping
 * (`__v`, soft-delete markers, timestamps). Falls back to a bare hex id string
 * if a raw, unpopulated ObjectId slips through.
 *
 * Mirrors `toValueResponse` from the value module; shared by the job-profile
 * read paths that `$lookup` their `jobTitle`, `industry`, and `workMode` arrays.
 */
export const toNamedRefResponse = (v: unknown): NamedCatalogResponseDto | string => {
  if (!v || typeof v !== "object") return String(v);
  const val = v as Record<string, unknown>;
  // A raw, unpopulated ObjectId is also `typeof "object"` but carries none of a
  // catalog document's own fields — stringify it to its hex id instead.
  if (!has(val, "_id") && !has(val, "name")) return String(v);
  return {
    _id: String(val._id),
    name: val.name,
    description: val.description,
    isActive: val.isActive,
  } as NamedCatalogResponseDto;
};

/** Serializes an array that may hold populated catalog documents or raw ObjectIds. */
export const toNamedRefResponseList = (items: unknown): (NamedCatalogResponseDto | string)[] =>
  Array.isArray(items) ? items.map(toNamedRefResponse) : [];
