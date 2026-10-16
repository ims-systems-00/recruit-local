import assert from "assert";
import { JOB_MATCH_PART_ENUMS, JOB_MATCH_WEIGHTS } from "@rl/types";
import { RankingMatcher, runMatchers } from "../../application/ranking/pipeline";
import { matchSkills } from "./skill";
import { matchValueScores } from "./value";
import { matchLocation } from "./location";

/**
 * A candidate's overall match against one job, as a percentage.
 *
 * Three matchers — skills, values, location — each report a 0-1 ratio, and the
 * application ranking's combiner (`runMatchers`) folds them with
 * `JOB_MATCH_WEIGHTS`: a part the job gives nothing to compare drops out and
 * the rest are rescaled, and the result rounds once.
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
  /** Names of the candidate's preferred work modes. */
  workModes?: unknown;
}

/** The parts of a job the matchers read, as the job list returns it. */
export interface MatchJob {
  skills?: unknown;
  values?: unknown;
  workplace?: unknown;
}

interface JobMatchContext {
  profile: MatchProfile;
  job: MatchJob;
}

const { SKILLS, VALUES, LOCATION } = JOB_MATCH_PART_ENUMS;

const JOB_MATCHERS: RankingMatcher<JobMatchContext>[] = [
  {
    key: SKILLS,
    label: "Skills",
    weight: JOB_MATCH_WEIGHTS[SKILLS],
    run: ({ job, profile }) => matchSkills(job.skills, profile.skills),
  },
  {
    key: VALUES,
    label: "Values",
    weight: JOB_MATCH_WEIGHTS[VALUES],
    run: ({ job, profile }) => matchValueScores(job.values, profile.values, profile.valueScores),
  },
  {
    key: LOCATION,
    label: "Location",
    weight: JOB_MATCH_WEIGHTS[LOCATION],
    run: ({ job, profile }) => matchLocation({ workplace: job.workplace }, { workModes: profile.workModes }),
  },
];

const hasRows = (field: unknown) => Array.isArray(field) && field.length > 0;

/**
 * Whether the profile states anything a matcher compares. Each part's
 * applicability depends on the job, so without this an empty profile would
 * still score — zero on skills and values, full marks on location for having no
 * preference — and show a number that measures nothing.
 */
const hasAnythingToCompare = (profile: MatchProfile) =>
  hasRows(profile.skills) || hasRows(profile.values) || hasRows(profile.valueScores) || hasRows(profile.workModes);

/**
 * The candidate's match against one job, 0-100, or `null` when there is
 * nothing to compare: the profile states none of skills, values or work modes,
 * or the job gives none of the parts anything to measure.
 */
export const computeJobMatch = (profile: MatchProfile, job: MatchJob): number | null => {
  if (!hasAnythingToCompare(profile)) return null;
  const result = runMatchers({ profile, job }, JOB_MATCHERS, JOB_MATCH_SCALE);
  return result.applicable ? result.score : null;
};

// Runnable check for the combination rules. No database or Redis is touched.
// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/job/match/job-match.ts
const demo = () => {
  const job = {
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
    workModes: ["Hybrid"],
  };

  // Skills 3.7/6, values 1.71/4, location 1 (no coordinates yet) at 40/40/20.
  assert(computeJobMatch(profile, job) === 62, "worked example without distance is 62");

  // A part with nothing to compare drops out and the rest rescale: values alone.
  assert(computeJobMatch(profile, { values: job.values }) === 43, "values alone is 43");
  assert(computeJobMatch(profile, { workplace: "onsite" }) === 80, "location alone: onsite job, hybrid candidate");

  assert(computeJobMatch(profile, {}) === null, "a job with nothing to compare is null");
  assert(computeJobMatch({}, job) === null, "an empty profile is null, not a low score");
  assert(
    computeJobMatch({ skills: "react", values: [], workModes: [] }, job) === null,
    "legacy free-text skills alone are nothing to compare"
  );
  assert(computeJobMatch({ workModes: ["Remote"] }, { workplace: "onsite" }) === 30, "work modes alone still score");

  console.log("job match self-check ok");
};

if (require.main === module) demo();
