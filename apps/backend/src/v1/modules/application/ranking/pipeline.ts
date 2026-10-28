import { APPLICATION_MATCH_PART_ENUMS, MATCH_SCORE_SCALE, VALUE_TYPE_ENUM } from "@rl/types";
import { JobProfileInput } from "../../../../models/job-profile.model";
import { IJobDoc, IJobInput } from "../../../../models/job.model";
import { ApplicationInput } from "../../../../models/application.model";
import { QuestionMatchResult, matchQuestionAnswers } from "./matching/valuebasedQuestion";
import { ExperienceMatchResult, MatchableExperienceLevel, matchExperience } from "./matching/experience";
import { ValueMatchResult, matchValueScores } from "../../job/match/value";
import { SkillMatchResult, matchSkills } from "../../job/match/skill";
import { RoleMatchResult, matchRole } from "../../job/match/role";
import { LocationMatchResult, fromGeoJson, matchLocation } from "../../job/match/location";
// Type-only: `job-match.ts` imports `runMatchers` from here, so a value import would be a cycle.
import type { MatchProfile } from "../../job/match/job-match";

/**
 * The ranking pipeline.
 *
 * Ranking an application means asking several independent questions about how
 * well a candidate fits a job — do their values line up, their skills, their
 * salary expectation — and folding the answers into one number. Each of those
 * questions is a matcher — in `matching/`, or in `job/match/` for the parts the
 * candidate's own job match scores too — and this file is the ordered list of
 * matchers plus the code that runs them.
 *
 * Adding a technique means writing it in `matching/` and appending one entry to
 * `RANKING_PIPELINE`. Nothing else changes.
 */

/**
 * A value document as `populateValuesQuery` returns it. Loose on purpose: `_id`
 * may arrive as an `ObjectId` or as an already-stringified id.
 */
interface MatchableValue {
  _id: unknown;
  type?: VALUE_TYPE_ENUM | string;
  weight?: number;
}

/**
 * A parent document read through `populateValuesQuery`, where the `values`
 * array of ObjectIds has been replaced by the value documents themselves.
 */
type WithPopulatedValues<T> = Omit<T, "values"> & { values?: MatchableValue[] };

/**
 * The candidate's profile as the ranking fetch reads it: `values` populated into
 * documents, and the single `experienceLevel` reference resolved into the level
 * itself so its span of years is available to compare.
 */
export type RankingJobProfile = Omit<WithPopulatedValues<JobProfileInput>, "experienceLevel"> & {
  experienceLevel?: MatchableExperienceLevel | null;
};

/** The job as the ranking fetch reads it, with the geocoded point the location matcher measures from. */
export type RankingJob = IJobInput & Pick<IJobDoc, "geo">;

/**
 * The parts of the application a matcher may read. Narrow on purpose — widen it
 * as matchers claim fields, so the worker's `select` and this type stay in step.
 */
export type RankingApplication = Pick<ApplicationInput, "answers">;

/**
 * Everything a matcher may look at, assembled once per application being
 * ranked. Matchers read only the parts they need — the job's values against the
 * candidate's value scores, the job's screening questions and the answers to
 * them, both sides' skills, roles and locations — so the fetch that builds this
 * should populate whatever the registered matchers actually consume and no more.
 */
export interface RankingContext {
  /** The applying candidate's profile. */
  jobProfile: RankingJobProfile;
  /**
   * The same profile as the candidate's job match reads it (`loadMatchProfile`):
   * catalogue skills, job titles, industries and work modes resolved to names,
   * interests, and the geocoded address. Read through the same field spec so
   * the skills, role and location matchers judge exactly what the candidate's
   * own match does.
   */
  matchProfile: MatchProfile;
  /** The job applied to. */
  job: RankingJob;
  /** The application being scored — the candidate's own submission. */
  application: RankingApplication;
}

/**
 * The top of the ranking scale. Decided once, as `MATCH_SCORE_SCALE` in
 * `@rl/types`, so the frontend reads stored scores on the same scale. Matchers
 * report normalized ratios and know nothing about it, so moving it moves every
 * score with it and changes nothing else.
 *
 * Changing it makes previously stored scores incomparable to new ones — bump
 * `RANKING_PIPELINE_VERSION` alongside it so stale rows can be found, and move
 * `MATCH_SCORE_BAND_FLOORS` with it.
 */
export const RANKING_SCALE = MATCH_SCORE_SCALE;

/** One matcher's answer. */
export interface RankingSignal {
  key: string;
  label: string;
  /** 0-1, unrounded — what the matcher actually reported. */
  ratio: number;
  /**
   * `ratio` scaled and rounded, for display only. Never fed back into the
   * composite: the composite is computed from raw ratios so it rounds once.
   */
  score: number;
  /**
   * False when this matcher had nothing to work with — the recruiter set no
   * values, the job named no skills. The signal is dropped from the composite
   * and its weight is shared out among the matchers that did run, so a sparsely
   * filled job does not drag every candidate's score down equally.
   */
  applicable: boolean;
  /** Share of the final score this signal actually carried, 0-1. */
  influence: number;
  /** The matcher's own result, for explaining the score back to a recruiter. */
  details: unknown;
}

/**
 * One matcher. `C` is what it reads — the application context by default, but
 * the combiner below only ever passes it through, so another feature can score
 * against a context of its own with the same weighting rules.
 */
export interface RankingMatcher<C = RankingContext> {
  key: string;
  label: string;
  /**
   * Relative importance. Only the proportion between matchers matters — weights
   * are renormalized at run time over whichever matchers turned out to be
   * applicable, so they need not sum to anything in particular. Scaled up by
   * `RANKING_SCALE`, a weight is effectively that matcher's point budget.
   */
  weight: number;
  /**
   * Must return a normalized 0-1 ratio. Scaling and rounding belong to the
   * pipeline — a matcher that pre-scales would be averaged as if it were a
   * ratio and swamp every other signal.
   */
  run: (context: C) => { ratio: number; applicable: boolean; details?: unknown };
}

export interface RankingResult {
  /** 0-1, unrounded: the weighted mean of every applicable signal's ratio. */
  ratio: number;
  /** `ratio` scaled to `scale` and rounded — the number to store and show. */
  score: number;
  /** The denominator `score` is out of, so a consumer can render "56 / 100". */
  scale: number;
  /** False when no matcher could run at all; `score` is then meaningless. */
  applicable: boolean;
  signals: RankingSignal[];
}

// Each matcher's key is the part it scores, as stored in `matchBreakdown`.
const { VALUES, SKILLS, ROLE, LOCATION, QUESTION, EXPERIENCE } = APPLICATION_MATCH_PART_ENUMS;

/**
 * How well the candidate's values line up with the values this job lists. Each
 * of the job's values earns the candidate's evaluated score in it, a small
 * credit if they only selected it, or nothing — see `job/match/value.ts` for
 * the scoring.
 *
 * The job's values rather than the organisation's, so a recruiter can tune what
 * one role asks for. The job's `priority` on each value is not read, as in the
 * candidate's own job match, so this part scores the same on both sides. Not
 * applicable when the job lists no values.
 */
export const valueMatcher: RankingMatcher = {
  key: VALUES,
  label: "Values",
  weight: 2,
  run: ({ job, matchProfile }) => {
    const result: ValueMatchResult = matchValueScores(job.values, matchProfile.values, matchProfile.valueScores);
    return { ratio: result.ratio, applicable: result.applicable, details: result };
  },
};

/**
 * How well the candidate answered the job's own screening questions, graded
 * against the `expectedAnswer` the recruiter keyed on each one — see
 * `matching/valuebasedQuestion.ts` for the scoring.
 *
 * Weighted below values deliberately. Values are the comparison the product is
 * built on; screening answers sharpen the ranking within that, they do not
 * replace it. Either signal renormalizes to the full score on its own when the
 * other has nothing to work with.
 */
export const questionMatcher: RankingMatcher = {
  key: QUESTION,
  label: "Screening Questions",
  weight: 1,
  run: ({ job, application }) => {
    const result: QuestionMatchResult = matchQuestionAnswers(job.additionalQueries, application.answers);
    return { ratio: result.ratio, applicable: result.applicable, details: result };
  },
};

/**
 * Whether the candidate's experience level answers the job's stated requirement
 * in years — see `matching/experience.ts` for the scoring, which treats being
 * under the requirement far more harshly than being over it.
 */
export const experienceMatcher: RankingMatcher = {
  key: EXPERIENCE,
  label: "Experience",
  weight: 1,
  run: ({ job, jobProfile }) => {
    const result: ExperienceMatchResult = matchExperience(job.yearOfExperience, jobProfile.experienceLevel);
    return { ratio: result.ratio, applicable: result.applicable, details: result };
  },
};

/**
 * How well the candidate's skills cover the job's, level by level — see
 * `job/match/skill.ts` for the scoring. The matcher behind the candidate's own
 * job match, so both sides of the platform judge skills alike.
 *
 * Weighted level with values, as the two are in the candidate's job match
 * (`JOB_MATCH_WEIGHTS`). Not applicable when the job names no skills.
 */
export const skillMatcher: RankingMatcher = {
  key: SKILLS,
  label: "Skills",
  weight: 2,
  run: ({ job, matchProfile }) => {
    const result: SkillMatchResult = matchSkills(job.skills, matchProfile.skills);
    return { ratio: result.ratio, applicable: result.applicable, details: result };
  },
};

/**
 * Whether the job is the kind of role the candidate is after: the words of its
 * title and category against the job titles, industries and interests on their
 * profile — see `job/match/role.ts`.
 */
export const roleMatcher: RankingMatcher = {
  key: ROLE,
  label: "Role",
  weight: 1,
  run: ({ job, matchProfile }) => {
    const result: RoleMatchResult = matchRole(
      { title: job.title, category: job.category },
      { jobTitles: matchProfile.jobTitles, industries: matchProfile.industries, interests: matchProfile.interests }
    );
    return { ratio: result.ratio, applicable: result.applicable, details: result };
  },
};

/**
 * Whether the job's workplace suits the candidate's preferred work modes and,
 * once both sides are geocoded, whether they live close enough to get there —
 * see `job/match/location.ts`.
 */
export const locationMatcher: RankingMatcher = {
  key: LOCATION,
  label: "Location",
  weight: 1,
  run: ({ job, matchProfile }) => {
    const result: LocationMatchResult = matchLocation(
      { workplace: job.workplace, point: fromGeoJson(job.geo) },
      { workModes: matchProfile.workModes, point: fromGeoJson(matchProfile.geo) }
    );
    return { ratio: result.ratio, applicable: result.applicable, details: result };
  },
};

/**
 * The matchers, in the order their signals are reported. Order is presentation
 * only — the composite score is weight-driven and order-independent.
 */
export const RANKING_PIPELINE: RankingMatcher[] = [
  valueMatcher,
  skillMatcher,
  roleMatcher,
  locationMatcher,
  questionMatcher,
  experienceMatcher,
];

/**
 * Stamped onto every stored ranking. Bump it whenever a change would make old
 * scores incomparable to new ones — adding or removing a matcher, retuning a
 * weight, changing `RANKING_SCALE`, changing how a matcher scores — and
 * whenever `matchBreakdown` gains something older rankings lack, so the
 * backfill fills it in. Stored rankings carrying an older version are stale by
 * definition and can be found and re-ranked with a single query; without it
 * there is no way to tell a fresh score from a legacy one.
 */
export const RANKING_PIPELINE_VERSION = 8;

/**
 * Runs every matcher against `context` and folds the applicable ones into a
 * single score out of `scale`.
 *
 * Matchers are synchronous and read-only: the context is fetched once by the
 * caller and every matcher works off it, so scoring a page of documents costs
 * one query set, not one per document.
 *
 * Generic over the context so a feature other than application ranking can
 * reuse the weighting rules — renormalize over applicable matchers, round once
 * — with matchers and a scale of its own.
 */
export const runMatchers = <C>(context: C, matchers: RankingMatcher<C>[], scale: number): RankingResult => {
  const outcomes = matchers.map((matcher) => ({ matcher, outcome: matcher.run(context) }));

  // Only applicable matchers with a positive weight can move the score.
  const totalWeight = outcomes.reduce(
    (total, { matcher, outcome }) => (outcome.applicable && matcher.weight > 0 ? total + matcher.weight : total),
    0
  );

  const signals: RankingSignal[] = outcomes.map(({ matcher, outcome }) => {
    const counts = outcome.applicable && matcher.weight > 0 && totalWeight > 0;
    return {
      key: matcher.key,
      label: matcher.label,
      ratio: outcome.ratio,
      // Display only — the composite below works off `outcome.ratio`, never this.
      score: Math.round(outcome.ratio * scale),
      applicable: outcome.applicable,
      influence: counts ? Number((matcher.weight / totalWeight).toFixed(4)) : 0,
      details: outcome.details ?? null,
    };
  });

  if (totalWeight <= 0) return { ratio: 0, score: 0, scale, applicable: false, signals };

  // Averaged as raw ratios and scaled at the very end, so the result rounds
  // exactly once however many matchers contributed.
  const weighted = outcomes.reduce(
    (total, { matcher, outcome }) =>
      outcome.applicable && matcher.weight > 0 ? total + outcome.ratio * matcher.weight : total,
    0
  );

  const ratio = weighted / totalWeight;

  return { ratio, score: Math.round(ratio * scale), scale, applicable: true, signals };
};

/**
 * Ranks one application: the registered pipeline, out of `RANKING_SCALE`.
 *
 * `scale` is injectable for testing; production callers should leave it alone
 * so `RANKING_SCALE` stays the single answer to "what is a score out of?".
 */
export const runRankingPipeline = (
  context: RankingContext,
  matchers: RankingMatcher[] = RANKING_PIPELINE,
  scale: number = RANKING_SCALE
): RankingResult => runMatchers(context, matchers, scale);
