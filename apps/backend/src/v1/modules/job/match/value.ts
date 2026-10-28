import assert from "assert";
import { JOB_VALUE_PRIORITY_ENUMS } from "@rl/types";
import { refId } from "./ref-id";

/**
 * Value matching, as a candidate sees it.
 *
 * A job lists values from the shared value catalogue; a candidate selects values
 * from the same catalogue and can evaluate each one, which stores a 0-100 score
 * on their profile (`valueScores`). Each of the job's values earns a credit:
 *
 * - **Evaluated** — the score, as a fraction. Counted whether or not the value
 *   is in the candidate's `values` yet: onboarding evaluates a value before the
 *   selection is saved, and deselecting a value deletes its score anyway.
 * - **Selected, not evaluated** — `CLAIMED_VALUE_CREDIT`. A profile may select
 *   any number of values, so a bare claim has to stay cheap or selecting the
 *   whole catalogue would pay.
 * - **Neither** — nothing.
 *
 * The ratio is the plain mean of the credits. A job's `priority` on each value
 * is deliberately never read. Candidates may not see it (`values.priority` is
 * kept out of their job read fields), and a score weighted by it would give it
 * away: drop one value from your profile, reload the job, and the fall in the
 * score is that value's share of the weights. Leaving it out of the computation
 * is the only way the result is safe to show.
 *
 * Pure and synchronous — hand it the job's rows and the profile's two fields.
 */

/** Credit for a value the candidate selected but has not evaluated. */
const CLAIMED_VALUE_CREDIT = 0.25;

/** The shape this matcher needs off one of a job's value rows. `priority` may be present; it is ignored. */
export interface MatchableJobValueRow {
  value?: unknown;
}

/** The shape this matcher needs off one of a profile's `valueScores`. */
export interface MatchableValueScore {
  value?: unknown;
  score?: unknown;
}

export interface ValueMatchResult {
  /** 0-1, unrounded. Zero is a real result: the job names values and the candidate shows none of them. */
  ratio: number;
  /** False when the job names no values, so there is nothing to match. */
  applicable: boolean;
}

/** One of the job's values and the credit the candidate earns in it. */
export interface ValueCredit {
  id: string;
  /** 0-1: the evaluated score, `CLAIMED_VALUE_CREDIT`, or 0. */
  credit: number;
}

/** Ids of the values the candidate selected. Anything that is not an array reads as none. */
const indexSelected = (values: unknown): Set<string> => {
  const ids = new Set<string>();
  if (!Array.isArray(values)) return ids;
  for (const value of values) {
    const id = refId(value);
    if (id !== null) ids.add(id);
  }
  return ids;
};

/** Each evaluated value's score as a 0-1 fraction, by value id. Unusable entries are skipped. */
const indexScores = (valueScores: unknown): Map<string, number> => {
  const byId = new Map<string, number>();
  if (!Array.isArray(valueScores)) return byId;
  for (const entry of valueScores as MatchableValueScore[]) {
    const id = refId(entry?.value);
    const score = entry?.score;
    if (id === null || typeof score !== "number" || !Number.isFinite(score)) continue;
    byId.set(id, Math.min(100, Math.max(0, score)) / 100);
  }
  return byId;
};

/**
 * The credit a candidate earns in each of a job's values, in the job's order.
 * Inputs as `matchValueScores`, which averages these.
 */
export const creditValues = (
  jobValues: unknown,
  profileValues: unknown,
  profileValueScores: unknown
): ValueCredit[] => {
  const selected = indexSelected(profileValues);
  const scores = indexScores(profileValueScores);
  const seen = new Set<string>();
  const credits: ValueCredit[] = [];

  for (const row of Array.isArray(jobValues) ? (jobValues as MatchableJobValueRow[]) : []) {
    const id = refId(row?.value);
    // A row with no value id is skipped rather than counted as a miss, and a
    // repeated value counts once.
    if (id === null || seen.has(id)) continue;
    seen.add(id);

    credits.push({ id, credit: scores.get(id) ?? (selected.has(id) ? CLAIMED_VALUE_CREDIT : 0) });
  }

  return credits;
};

/**
 * Scores how well a candidate's values line up with a job's.
 *
 * All three inputs are typed `unknown` because a stored document cannot be
 * trusted to hold arrays: anything that is not one reads as empty.
 *
 * @param jobValues The job's `values` rows (`MatchableJobValueRow[]`).
 * @param profileValues The candidate's `JobProfile.values` — the ids they selected.
 * @param profileValueScores The candidate's `JobProfile.valueScores` (`MatchableValueScore[]`).
 */
export const matchValueScores = (
  jobValues: unknown,
  profileValues: unknown,
  profileValueScores: unknown
): ValueMatchResult => {
  const credits = creditValues(jobValues, profileValues, profileValueScores);
  if (credits.length === 0) return { ratio: 0, applicable: false };

  const total = credits.reduce((sum, { credit }) => sum + credit, 0);
  return { ratio: total / credits.length, applicable: true };
};

// Runnable check for the scoring rules. No database or Redis is touched.
// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/job/match/value.ts
const demo = () => {
  const { ESSENTIAL, DESIRABLE } = JOB_VALUE_PRIORITY_ENUMS;
  const close = (actual: number, expected: number) => Math.abs(actual - expected) < 1e-9;

  // The worked example: Growth-oriented evaluated 82, Collaborative evaluated
  // 64, Integrity selected only, Customer-first not selected -> (0.82 + 0.64 + 0.25 + 0) / 4.
  const job = [
    { value: { _id: "growth", label: "Growth-oriented" }, priority: ESSENTIAL },
    { value: { _id: "collab", label: "Collaborative" }, priority: DESIRABLE },
    { value: { _id: "integrity", label: "Integrity" }, priority: ESSENTIAL },
    { value: { _id: "customer", label: "Customer-first" }, priority: DESIRABLE },
  ];
  const values = ["growth", "collab", "integrity", "teamwork"];
  const valueScores = [
    { value: "growth", score: 82 },
    { value: "collab", score: 64 },
  ];
  const example = matchValueScores(job, values, valueScores);
  assert(example.applicable && close(example.ratio, 1.71 / 4), "worked example scores 1.71 / 4");

  const reranked = job.map((row) => ({ ...row, priority: row.priority === ESSENTIAL ? DESIRABLE : ESSENTIAL }));
  assert(matchValueScores(reranked, values, valueScores).ratio === example.ratio, "priority never changes the score");

  assert(
    close(matchValueScores(job, [], valueScores).ratio, 1.46 / 4),
    "an evaluated value counts even before it is selected"
  );
  assert(
    close(matchValueScores(job, values, [{ value: "growth", score: 140 }]).ratio, (1 + 0.25 + 0.25) / 4),
    "an out-of-range score is clamped"
  );
  assert(
    close(matchValueScores(job, values, [{ value: "growth", score: "82" }]).ratio, 0.75 / 4),
    "a non-numeric score falls back to the selection"
  );
  assert(!matchValueScores([], values, valueScores).applicable, "a job with no values is not applicable");
  assert(!matchValueScores(undefined, values, valueScores).applicable, "a job missing values is not applicable");
  const nothing = matchValueScores(job, undefined, undefined);
  assert(nothing.applicable && nothing.ratio === 0, "an empty profile scores 0");
  assert(
    close(matchValueScores([job[0], job[0]], values, valueScores).ratio, 0.82),
    "a repeated job value counts once"
  );
  assert(
    close(matchValueScores([{ value: null }, job[1]], values, valueScores).ratio, 0.64),
    "a row with no value id is skipped"
  );

  console.log("value match self-check ok");
};

if (require.main === module) demo();
