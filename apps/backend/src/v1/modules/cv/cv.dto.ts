import {
  CvEducationResponseDto,
  CvExperienceResponseDto,
  CvFileDto,
  CvInterestResponseDto,
  CvResponseDto,
  CvSkillResponseDto,
} from "@rl/types";

const toIso = (v: unknown): string => (v instanceof Date ? v.toISOString() : (v as string));

const has = (obj: Record<string, unknown>, key: string): boolean => Object.prototype.hasOwnProperty.call(obj, key);

const toIdScoped = <T extends { _id?: string }>(o: Record<string, unknown>): T => ({
  ...(o as unknown as T),
  ...(o._id != null ? { _id: String(o._id) } : {}),
});

const toExperience = (e: Record<string, unknown>): CvExperienceResponseDto => {
  const item = toIdScoped<CvExperienceResponseDto>(e);
  if (has(e, "startDate")) item.startDate = e.startDate == null ? undefined : toIso(e.startDate);
  if (has(e, "endDate")) item.endDate = e.endDate == null ? null : toIso(e.endDate);
  return item;
};

const toEducation = (e: Record<string, unknown>): CvEducationResponseDto => {
  const item = toIdScoped<CvEducationResponseDto>(e);
  if (has(e, "startDate")) item.startDate = e.startDate == null ? undefined : toIso(e.startDate);
  if (has(e, "endDate")) item.endDate = e.endDate == null ? null : toIso(e.endDate);
  return item;
};

/**
 * Serializes a (possibly partial) sanitized CV into its public HTTP shape.
 * A field that was sanitized away stays absent. ObjectIds become strings, dates
 * become ISO strings, and internal bookkeeping fields are dropped.
 */
export const toCvResponse = (doc: unknown): CvResponseDto => {
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
  if (has(d, "userId")) d.userId = d.userId == null ? null : String(d.userId);
  if (has(d, "jobProfileId")) d.jobProfileId = d.jobProfileId == null ? null : String(d.jobProfileId);
  if (has(d, "imageId")) d.imageId = d.imageId == null ? null : String(d.imageId);
  if (has(d, "resumeId")) d.resumeId = d.resumeId == null ? null : String(d.resumeId);
  if (has(d, "createdAt")) d.createdAt = toIso(d.createdAt);
  if (has(d, "updatedAt")) d.updatedAt = toIso(d.updatedAt);

  if (has(d, "experience") && Array.isArray(d.experience)) {
    d.experience = d.experience.map((e) => toExperience(e as Record<string, unknown>));
  }
  if (has(d, "education") && Array.isArray(d.education)) {
    d.education = d.education.map((e) => toEducation(e as Record<string, unknown>));
  }
  if (has(d, "skills") && Array.isArray(d.skills)) {
    d.skills = d.skills.map((s) => toIdScoped<CvSkillResponseDto>(s as Record<string, unknown>));
  }
  if (has(d, "interests") && Array.isArray(d.interests)) {
    d.interests = d.interests.map((i) => toIdScoped<CvInterestResponseDto>(i as Record<string, unknown>));
  }

  // Populated relation: serialize its ObjectId to a string when present.
  if (d.resume != null) d.resume = toIdScoped<CvFileDto>(d.resume as Record<string, unknown>);

  return d as CvResponseDto;
};

export const toCvResponseList = (docs: unknown[]): CvResponseDto[] => docs.map(toCvResponse);
