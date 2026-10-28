/**
 * The id behind a catalogue reference, whichever form it arrives in: a bare
 * `ObjectId` or id string (a profile read with `.lean()`), or the populated
 * entry `{ _id, ... }` (a job read through `catalogueRowsLookupQuery`). `null`
 * when there is no usable id, so callers can skip the row.
 */
export const refId = (ref: unknown): string | null => {
  if (ref === null || ref === undefined) return null;
  const raw = typeof ref === "object" && "_id" in ref ? (ref as { _id: unknown })._id : ref;
  if (raw === null || raw === undefined) return null;
  const id = String(raw).trim();
  return id || null;
};
