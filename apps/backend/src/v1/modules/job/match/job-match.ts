import assert from "assert";
import { JOB_MATCH_PART_ENUMS, JOB_MATCH_WEIGHTS, JobMatchPartDto } from "@rl/types";
import { RankingMatcher, runMatchers } from "../../application/ranking/pipeline";
import { matchSkills } from "./skill";
import { matchValueScores } from "./value";
import { matchRole } from "./role";
import { fromGeoJson, matchLocation } from "./location";

/**
 * A candidate's overall match against one job, as a percentage.
 *
 * Four matchers — skills, values, role, location — each report a 0-1 ratio,
 * and the application ranking's combiner (`runMatchers`) folds them with
 * `JOB_MATCH_WEIGHTS`, rounding once.
 *
 * Every part always counts at its full weight: one with nothing to compare, on
 * either side, scores 0 rather than dropping out. Rescaling whatever parts
 * remained let a job with no skills or values show 100% on work mode alone.
 *
 * Every matcher reads only the job as a candidate may see it and the
 * candidate's own profile, so the number is safe to show them. See
 * `./value.ts` for why the employer's value priorities are left out.
 *
 * Pure and synchronous: `loadMatchProfile` reads the profile once per request,
 * and this runs per job on the page.
 */

/** `matchPercentage` is out of 100. */
const JOB_MATCH_SCALE = 100;

/** The candidate's side, as `loadMatchProfile` reads it. */
export interface MatchProfile {
  skills?: unknown;
  values?: unknown;
  valueScores?: unknown;
  /** Names of the job titles the candidate picked. */
  jobTitles?: unknown;
  /** Names of the industries the candidate picked. */
  industries?: unknown;
  /** The candidate's free-text interests. */
  interests?: unknown;
  /** Names of the candidate's preferred work modes. */
  workModes?: unknown;
  /** The candidate's geocoded address, as stored (GeoJSON). */
  geo?: unknown;
}

/** The parts of a job the matchers read, as the job list returns it. */
export interface MatchJob {
  title?: unknown;
  category?: unknown;
  skills?: unknown;
  values?: unknown;
  workplace?: unknown;
  /** The job's geocoded location, as stored (GeoJSON). */
  geo?: unknown;
}

interface JobMatchContext {
  profile: MatchProfile;
  job: MatchJob;
}

const { SKILLS, VALUES, ROLE, LOCATION } = JOB_MATCH_PART_ENUMS;

/**
 * A part the job gives nothing to compare still counts, as 0. The matchers
 * report it as not applicable, which would make `runMatchers` drop the part and
 * rescale the rest.
 */
const missingCountsAsZero = (result: { ratio: number; applicable: boolean }) =>
  result.applicable ? result : { ratio: 0, applicable: true };

const JOB_MATCHERS: RankingMatcher<JobMatchContext>[] = [
  {
    key: SKILLS,
    label: "Skills",
    weight: JOB_MATCH_WEIGHTS[SKILLS],
    run: ({ job, profile }) => missingCountsAsZero(matchSkills(job.skills, profile.skills)),
  },
  {
    key: VALUES,
    label: "Values",
    weight: JOB_MATCH_WEIGHTS[VALUES],
    run: ({ job, profile }) => missingCountsAsZero(matchValueScores(job.values, profile.values, profile.valueScores)),
  },
  {
    key: ROLE,
    label: "Role",
    weight: JOB_MATCH_WEIGHTS[ROLE],
    run: ({ job, profile }) =>
      missingCountsAsZero(
        matchRole(
          { title: job.title, category: job.category },
          { jobTitles: profile.jobTitles, industries: profile.industries, interests: profile.interests }
        )
      ),
  },
  {
    key: LOCATION,
    label: "Location",
    weight: JOB_MATCH_WEIGHTS[LOCATION],
    run: ({ job, profile }) =>
      missingCountsAsZero(
        matchLocation(
          { workplace: job.workplace, point: fromGeoJson(job.geo) },
          { workModes: profile.workModes, point: fromGeoJson(profile.geo) }
        )
      ),
  },
];

const hasRows = (field: unknown) => Array.isArray(field) && field.length > 0;
const hasText = (field: unknown) => typeof field === "string" && field.trim().length > 0;

/**
 * Whether the profile states anything a matcher compares. A profile with
 * nothing in it yet gets no score at all rather than 0% on every job, so a new
 * candidate sees no badge until there is something to measure.
 */
const hasAnythingToCompare = (profile: MatchProfile) =>
  hasRows(profile.skills) ||
  hasRows(profile.values) ||
  hasRows(profile.valueScores) ||
  hasRows(profile.jobTitles) ||
  hasRows(profile.industries) ||
  hasText(profile.interests) ||
  hasRows(profile.workModes);

/** A candidate's match against one job, with the part scores behind it. */
export interface JobMatch {
  /** 0-100. */
  percentage: number;
  /** Each part alone, 0-100, in `JOB_MATCH_PART_ENUMS` order. */
  parts: JobMatchPartDto[];
}

/**
 * The candidate's match against one job with each part's own score, or `null`
 * when their profile states none of skills, values, roles, interests or work
 * modes yet.
 */
export const computeJobMatchBreakdown = (profile: MatchProfile, job: MatchJob): JobMatch | null => {
  if (!hasAnythingToCompare(profile)) return null;
  const result = runMatchers({ profile, job }, JOB_MATCHERS, JOB_MATCH_SCALE);
  if (!result.applicable) return null;
  return {
    percentage: result.score,
    // Every matcher is keyed by its part, and each signal's display score is out of JOB_MATCH_SCALE.
    parts: result.signals.map(({ key, score }) => ({ key: key as JOB_MATCH_PART_ENUMS, percentage: score })),
  };
};

/**
 * The candidate's match against one job, 0-100, or `null` when their profile
 * states none of skills, values, roles, interests or work modes yet.
 */
export const computeJobMatch = (profile: MatchProfile, job: MatchJob): number | null =>
  computeJobMatchBreakdown(profile, job)?.percentage ?? null;

// Runnable check for the combination rules. No database or Redis is touched.
// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/job/match/job-match.ts
const demo = () => {
  const job = {
    title: "Senior Frontend Developer",
    skills: [
      { skill: { _id: "react" }, level: "advanced", requirement: "required" },
      { skill: { _id: "ts" }, level: "intermediate", requirement: "required" },
      { skill: { _id: "gql" }, level: "beginner", requirement: "preferred" },
      { skill: { _id: "figma" }, level: "willing-to-learn", requirement: "preferred" },
    ],
    values: [
      { value: { _id: "growth" } },
      { value: { _id: "collab" } },
      { value: { _id: "integrity" } },
      { value: { _id: "customer" } },
    ],
    workplace: "hybrid",
  };
  const profile = {
    skills: [
      { skill: "react", level: "intermediate" },
      { skill: "ts", level: "advanced" },
    ],
    values: ["growth", "collab", "integrity"],
    valueScores: [
      { value: "growth", score: 82 },
      { value: "collab", score: 64 },
    ],
    jobTitles: ["Frontend Developer"],
    workModes: ["Hybrid"],
  };

  // Skills 3.7/6, values 1.71/4, role 1, location 1 (no coordinates) at 35/35/15/15.
  assert(computeJobMatch(profile, job) === 67, "worked example without distance is 67");
  assert.deepStrictEqual(
    computeJobMatchBreakdown(profile, job),
    {
      percentage: 67,
      parts: [
        { key: SKILLS, percentage: 62 },
        { key: VALUES, percentage: 43 },
        { key: ROLE, percentage: 100 },
        { key: LOCATION, percentage: 100 },
      ],
    },
    "worked example parts: each part alone, rounded"
  );
  assert(computeJobMatchBreakdown({}, job) === null, "an empty profile has no breakdown");

  // The wrong role loses the role share, and nothing else.
  assert(computeJobMatch({ ...profile, jobTitles: ["Barista"] }, job) === 52, "the wrong role scores 0 on role");

  // Distance counts once both sides have a point: 28 km from a hybrid job keeps 0.8.
  const london = { type: "Point", coordinates: [-0.1278, 51.5074] };
  const north28 = { type: "Point", coordinates: [-0.1278, 51.5074 + 28 / ((6371 * Math.PI) / 180)] };
  const paris = { type: "Point", coordinates: [2.3522, 48.8566] };
  assert(computeJobMatch({ ...profile, geo: north28 }, { ...job, geo: london }) === 64, "worked example is 64");
  assert(
    computeJobMatch({ ...profile, geo: paris }, { ...job, geo: london }) === 52,
    "too far loses the location share"
  );
  assert(
    computeJobMatch(profile, { ...job, geo: london }) === 67,
    "without the candidate's point, distance is skipped"
  );

  // A part with nothing to compare scores 0 at its full weight; nothing rescales.
  assert(computeJobMatch(profile, { values: job.values }) === 15, "a job with only values: 0.35 x 0.4275");
  assert(computeJobMatch(profile, { workplace: "onsite" }) === 12, "a job with only a workplace: 0.15 x 0.8");
  assert(computeJobMatch(profile, {}) === 0, "a job with nothing to compare scores 0");

  // Missing on the candidate's side counts as 0 too: no work mode set.
  const { workModes, ...noWorkMode } = profile;
  assert(workModes.length && computeJobMatch(noWorkMode, job) === 52, "no work mode loses the location share");
  assert(
    computeJobMatch(noWorkMode, { workplace: "remote" }) === 0,
    "an old job with only a workplace, against no work mode, is 0, not 100"
  );

  assert(computeJobMatch({}, job) === null, "an empty profile is null, not 0");
  assert(
    computeJobMatch({ skills: "react", values: [], workModes: [] }, job) === null,
    "legacy free-text skills alone are nothing to compare"
  );
  assert(computeJobMatch({ workModes: ["Remote"] }, { workplace: "remote" }) === 15, "work modes alone: 0.15 x 1");
  assert(computeJobMatch({ jobTitles: ["Data Scientist"] }, { title: "Data Scientist" }) === 15, "roles alone: 0.15");
  assert(computeJobMatch({ interests: "   " }, job) === null, "blank interests are nothing to compare");

  console.log("job match self-check ok");
};

if (require.main === module) demo();
