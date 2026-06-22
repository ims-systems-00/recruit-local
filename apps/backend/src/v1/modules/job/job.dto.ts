import { AdditionalQueryResponseDto, JobResponseDto } from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

const toAdditionalQuery = (q: Record<string, unknown>): AdditionalQueryResponseDto => ({
  ...(q as unknown as AdditionalQueryResponseDto),
  ...(q._id != null ? { _id: String(q._id) } : {}),
});

/**
 * Serializes a (possibly partial) sanitized job into its public HTTP shape.
 * stays absent. ObjectIds become strings, dates become ISO strings, and
 * internal bookkeeping fields are dropped.
 */
export const toJobResponse = (doc: unknown): JobResponseDto => {
  const d = { ...((doc ?? {}) as Record<string, unknown>) };

  // Drop internal fields that should never be exposed.
  delete d.__v;
  delete d.deleteMarker;
  delete d.deletedAt;

  if (has(d, "_id")) d._id = String(d._id);
  if (has(d, "id")) d.id = String(d.id);
  if (has(d, "tenantId")) d.tenantId = d.tenantId == null ? null : String(d.tenantId);
  if (has(d, "formId")) d.formId = d.formId == null ? null : String(d.formId);
  if (has(d, "attachmentIds") && Array.isArray(d.attachmentIds)) d.attachmentIds = d.attachmentIds.map(String);
  if (has(d, "endDate")) d.endDate = d.endDate == null ? null : toIso(d.endDate);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);
  if (has(d, "additionalQueries") && Array.isArray(d.additionalQueries)) {
    d.additionalQueries = d.additionalQueries.map((q) => toAdditionalQuery(q as Record<string, unknown>));
  }

  return d as JobResponseDto;
};

export const toJobResponseList = (docs: unknown[]): JobResponseDto[] => docs.map(toJobResponse);
