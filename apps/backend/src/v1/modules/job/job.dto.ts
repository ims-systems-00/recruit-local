import {
  AdditionalQueryResponseDto,
  JobApplicantPreviewDto,
  JobResponseDto,
  JobSkillResponseDto,
  JobValueResponseDto,
  JOB_VALUE_PRIORITY_ENUMS,
  JOB_VALUE_PRIORITY_WEIGHT,
  NamedCatalogResponseDto,
  ValueResponseDto,
} from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

const toAdditionalQuery = (q: Record<string, unknown>): AdditionalQueryResponseDto => ({
  ...(q as unknown as AdditionalQueryResponseDto),
  ...(q._id != null ? { _id: String(q._id) } : {}),
});

// `skill` arrives populated — by jobSkillsLookupQuery on reads, by populate() on create.
const toJobSkill = (row: Record<string, unknown>): JobSkillResponseDto => {
  const skill = row.skill as Record<string, unknown>;
  return {
    ...(row as unknown as JobSkillResponseDto),
    skill: { ...(skill as unknown as NamedCatalogResponseDto), _id: String(skill._id) },
  };
};

// `value` arrives populated, as `skill` does. `weight` is derived here from the
// tier, never stored — and only when `priority` survived sanitizing.
const toJobValue = (row: Record<string, unknown>): JobValueResponseDto => {
  const value = row.value as Record<string, unknown>;
  const priority = row.priority as JOB_VALUE_PRIORITY_ENUMS | undefined;
  return {
    ...(row as unknown as JobValueResponseDto),
    value: { ...(value as unknown as ValueResponseDto), _id: String(value._id) },
    ...(priority ? { weight: JOB_VALUE_PRIORITY_WEIGHT[priority] } : {}),
  };
};

// Built field by field rather than spread, so nothing about an applicant but
// their profile id, name and photo URL can ride along on a job.
const toApplicantPreview = (row: Record<string, unknown>): JobApplicantPreviewDto => {
  const image = row.profileImage as { src?: string | null } | undefined;
  return {
    _id: String(row._id),
    ...(row.name != null ? { name: String(row.name) } : {}),
    ...(image ? { profileImage: { src: image.src ?? null } } : {}),
  };
};

/**
 * Serializes a (possibly partial) sanitized job into its public HTTP shape.
 * stays absent. ObjectIds become strings, dates become ISO strings, and
 * internal bookkeeping fields are dropped.
 */
export const toJobResponse = (doc: unknown): JobResponseDto => {
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
  if (has(d, "formId")) d.formId = d.formId == null ? null : String(d.formId);
  if (has(d, "attachmentIds") && Array.isArray(d.attachmentIds)) d.attachmentIds = d.attachmentIds.map(String);
  if (has(d, "alreadySavedId")) d.alreadySavedId = d.alreadySavedId == null ? null : String(d.alreadySavedId);
  if (has(d, "endDate")) d.endDate = d.endDate == null ? null : toIso(d.endDate);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);
  if (has(d, "additionalQueries") && Array.isArray(d.additionalQueries)) {
    d.additionalQueries = d.additionalQueries.map((q) => toAdditionalQuery(q as Record<string, unknown>));
  }
  if (has(d, "skills") && Array.isArray(d.skills)) {
    d.skills = d.skills.map((row) => toJobSkill(row as Record<string, unknown>));
  }
  if (has(d, "values") && Array.isArray(d.values)) {
    d.values = d.values.map((row) => toJobValue(row as Record<string, unknown>));
  }
  if (has(d, "applicantPreview") && Array.isArray(d.applicantPreview)) {
    d.applicantPreview = d.applicantPreview.map((row) => toApplicantPreview(row as Record<string, unknown>));
  }

  return d as JobResponseDto;
};

export const toJobResponseList = (docs: unknown[]): JobResponseDto[] => docs.map(toJobResponse);
