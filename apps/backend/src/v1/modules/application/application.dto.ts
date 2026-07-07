import {
  ApplicationAnswerResponseDto,
  ApplicationFileDto,
  ApplicationJobProfileDto,
  ApplicationResponseDto,
  ApplicationStatusDto,
} from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

const toAnswer = (a: Record<string, unknown>): ApplicationAnswerResponseDto => ({
  ...(a as unknown as ApplicationAnswerResponseDto),
  ...(a.queryId != null ? { queryId: String(a.queryId) } : {}),
});

const toIdScoped = <T extends { _id?: string }>(o: Record<string, unknown>): T => ({
  ...(o as unknown as T),
  ...(o._id != null ? { _id: String(o._id) } : {}),
});

/**
 * Serializes a (possibly partial) sanitized application into its public HTTP
 * shape. A field that was sanitized away stays absent. ObjectIds become strings,
 * dates become ISO strings, and internal bookkeeping fields are dropped.
 */
export const toApplicationResponse = (doc: unknown): ApplicationResponseDto => {
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
  if (has(d, "jobId")) d.jobId = d.jobId == null ? null : String(d.jobId);
  if (has(d, "jobProfileId")) d.jobProfileId = d.jobProfileId == null ? null : String(d.jobProfileId);
  if (has(d, "statusId")) d.statusId = d.statusId == null ? null : String(d.statusId);
  if (has(d, "resumeId")) d.resumeId = d.resumeId == null ? null : String(d.resumeId);
  if (has(d, "caseStudyId") && Array.isArray(d.caseStudyId)) d.caseStudyId = d.caseStudyId.map(String);
  if (has(d, "appliedAt")) d.appliedAt = d.appliedAt == null ? null : toIso(d.appliedAt);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);

  if (has(d, "answers") && Array.isArray(d.answers)) {
    d.answers = d.answers.map((a) => toAnswer(a as Record<string, unknown>));
  }

  // Populated relations: serialize their ObjectIds to strings when present.
  if (d.status != null) d.status = toIdScoped<ApplicationStatusDto>(d.status as Record<string, unknown>);
  if (d.jobProfile != null) {
    d.jobProfile = toIdScoped<ApplicationJobProfileDto>(d.jobProfile as Record<string, unknown>);
  }
  if (d.resume != null) d.resume = toIdScoped<ApplicationFileDto>(d.resume as Record<string, unknown>);
  if (has(d, "caseStudies") && Array.isArray(d.caseStudies)) {
    d.caseStudies = d.caseStudies.map((f) => toIdScoped<ApplicationFileDto>(f as Record<string, unknown>));
  }

  return d as ApplicationResponseDto;
};

export const toApplicationResponseList = (docs: unknown[]): ApplicationResponseDto[] => docs.map(toApplicationResponse);
