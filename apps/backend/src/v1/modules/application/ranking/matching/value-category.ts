import assert from "assert";
import { VALUE_TYPE_ENUM } from "@rl/types";
import { MatchableJobValueRow, matchValueScores } from "../../../job/match/value";
import { refId } from "../../../job/match/ref-id";

/**
 * The values part of a ranking, split by value type (mindset, working style,
 * culture, leadership, motivation), for the recruiter's breakdown of where a
 * candidate's values line up and where they do not.
 *
 * Each type is scored exactly as the whole values part is — `matchValueScores`
 * over just the job's values of that type — so the types are a faithful
 * breakdown: weighted by how many of the job's values each holds, they average
 * back to the values part. A job value whose catalogue entry has no known type
 * (hard-deleted since) counts toward the values part but toward no type.
 *
 * Pure and synchronous — the caller resolves each value's type.
 */

export interface ValueCategoryMatch {
  type: VALUE_TYPE_ENUM;
  /** 0-1, unrounded, over the job's values of this type alone. */
  ratio: number;
  /** False when the job lists no values of this type. */
  applicable: boolean;
}

/**
 * Scores the candidate's values against the job's, one value type at a time,
 * in `VALUE_TYPE_ENUM` order.
 *
 * @param jobValues The job's `values` rows.
 * @param profileValues The candidate's `JobProfile.values`.
 * @param profileValueScores The candidate's `JobProfile.valueScores`.
 * @param typeOf A value's type by its id, or undefined when unknown.
 */
export const matchValueCategories = (
  jobValues: unknown,
  profileValues: unknown,
  profileValueScores: unknown,
  typeOf: (valueId: string) => string | undefined
): ValueCategoryMatch[] => {
  const rows = Array.isArray(jobValues) ? (jobValues as MatchableJobValueRow[]) : [];
  const rowType = (row: MatchableJobValueRow) => {
    const id = refId(row?.value);
    return id === null ? undefined : typeOf(id);
  };

  return Object.values(VALUE_TYPE_ENUM).map((type) => {
    const { ratio, applicable } = matchValueScores(
      rows.filter((row) => rowType(row) === type),
      profileValues,
      profileValueScores
    );
    return { type, ratio, applicable };
  });
};

// Runnable check for the split. No database or Redis is touched.
// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/application/ranking/matching/value-category.ts
const demo = () => {
  const { MINDSET, WORKING_STYLE, LEADERSHIP } = VALUE_TYPE_ENUM;
  const close = (actual: number, expected: number) => Math.abs(actual - expected) < 1e-9;
  const types: Record<string, string> = { growth: MINDSET, curious: MINDSET, collab: WORKING_STYLE };

  const job = [{ value: "growth" }, { value: "curious" }, { value: "collab" }, { value: "retired" }];
  const values = ["growth", "collab"];
  const valueScores = [
    { value: "growth", score: 80 },
    { value: "collab", score: 60 },
  ];
  const result = matchValueCategories(job, values, valueScores, (id) => types[id]);
  const of = (type: VALUE_TYPE_ENUM) => result.find((category) => category.type === type)!;

  assert.deepStrictEqual(
    result.map((category) => category.type),
    Object.values(VALUE_TYPE_ENUM),
    "every type, in enum order"
  );
  assert(close(of(MINDSET).ratio, (0.8 + 0) / 2), "mindset: growth 0.8, curious missing");
  assert(close(of(WORKING_STYLE).ratio, 0.6), "working style: collab 0.6");
  assert(!of(LEADERSHIP).applicable, "a type the job lists nothing of is not applicable");

  // Weighted by count, the typed rows average back to the values part over the same rows.
  const typed = job.filter((row) => types[row.value]);
  const whole = matchValueScores(typed, values, valueScores).ratio;
  const weighted = (of(MINDSET).ratio * 2 + of(WORKING_STYLE).ratio * 1) / 3;
  assert(close(weighted, whole), "types average back to the values part");

  assert(
    matchValueCategories(undefined, values, valueScores, () => MINDSET).every((category) => !category.applicable),
    "a job with no values has no applicable type"
  );

  console.log("value category self-check ok");
};

if (require.main === module) demo();
