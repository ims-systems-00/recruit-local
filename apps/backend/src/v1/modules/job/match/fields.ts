import { PopulateOptions } from "mongoose";
import { MatchProfile } from "./job-match";

/**
 * What a job match reads off each side, kept in one place so every reader —
 * `loadMatchProfile` once per request, the feed workers over a cursor — selects
 * the same fields and shapes them the same way.
 */

/**
 * The profile fields the matchers compare: `valueScores` without its answers
 * and feedback text, and `geo`, the geocoded address, for distance. It stays
 * server-side like the rest of this.
 */
export const MATCH_PROFILE_SELECT =
  "skills values valueScores.value valueScores.score jobTitle industry interests workMode geo";

/**
 * The catalogue refs resolved to names, since names are what gets compared:
 * job titles and industries against a job's title and category, work modes
 * against its `workplace`.
 */
export const MATCH_PROFILE_POPULATE: PopulateOptions[] = [
  { path: "jobTitle", select: "name" },
  { path: "industry", select: "name" },
  { path: "workMode", select: "name" },
];

/** The paths `MATCH_PROFILE_POPULATE` fills, for `.populate<MatchProfilePopulated>(...)`. */
export interface MatchProfilePopulated {
  jobTitle: { name?: string }[];
  industry: { name?: string }[];
  workMode: { name?: string }[];
}

/** A profile as read with `MATCH_PROFILE_SELECT` and `MATCH_PROFILE_POPULATE`, lean. */
export interface MatchProfileSource extends Partial<MatchProfilePopulated> {
  skills?: unknown;
  values?: unknown;
  valueScores?: unknown;
  interests?: unknown;
  geo?: unknown;
}

// A hard-deleted catalogue entry populates as null and leaves an undefined name.
const names = (refs: { name?: string }[] | undefined) => (refs ?? []).map((ref) => ref?.name);

/** A profile read with the specs above, in the shape the matchers take. */
export const toMatchProfile = (profile: MatchProfileSource): MatchProfile => ({
  skills: profile.skills,
  values: profile.values,
  valueScores: profile.valueScores,
  jobTitles: names(profile.jobTitle),
  industries: names(profile.industry),
  interests: profile.interests,
  workModes: names(profile.workMode),
  geo: profile.geo,
});

/**
 * The job fields the matchers compare, read off the raw document: skill and
 * value refs stay bare ids, which the matchers take as readily as populated
 * rows. A value's `priority` is not fetched, since the value matcher never
 * reads it (see `./value.ts`).
 */
export const MATCH_JOB_SELECT =
  "title category skills.skill skills.level skills.requirement values.value workplace geo";
