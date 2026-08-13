import { VALUE_TYPE_ENUM } from "@rl/types";

/**
 * Value matching.
 *
 * Both sides of the comparison pick from the same shared `Value` catalog —
 * `JobProfile.values` for the candidate, `Tenant.values` for the recruiter who
 * posted the job — so a match is exact set overlap on `_id`. There is no string
 * similarity to do here, unlike the CV entity matcher.
 *
 * Two things make this more than a raw intersection count:
 *
 * 1. **Scored per category.** A value carries a `type` (working style, mindset,
 *    culture, leadership, motivation). Overlap is measured inside each category
 *    the recruiter actually expressed an opinion on, then combined. Categories
 *    the recruiter left empty are skipped rather than scored zero — silence is
 *    not a requirement to miss.
 *
 * 2. **Rarity weighted.** `Value.weight` is a global popularity counter, bumped
 *    every time anyone attaches that value. Agreeing on a value that almost
 *    nobody picks says more about fit than agreeing on one everybody picks, so
 *    rare values carry more of the score (the same idea as IDF).
 *
 * The score is recall-leaning: the question a recruiter is asking is "how much
 * of what I care about does this candidate share?", so covering the recruiter's
 * picks counts for more than the candidate keeping their own list short. A
 * precision term is still blended in, otherwise a candidate who selects the
 * entire catalog would score full marks against everyone.
 */

/** A bucket for values stored without a `type`, so they still match each other. */
const UNTYPED = "untyped";

type CategoryKey = VALUE_TYPE_ENUM | typeof UNTYPED;

/**
 * The shape this matcher needs off a value. Deliberately loose so it accepts a
 * populated Mongoose subdocument, a `.lean()` result, or an aggregation
 * projection without the caller reshaping first. `_id` is `unknown` because it
 * may arrive as an `ObjectId` or as an already-stringified id.
 */
export interface MatchableValue {
  _id: unknown;
  type?: VALUE_TYPE_ENUM | string;
  weight?: number;
}

export interface ValueMatchOptions {
  /**
   * How much more coverage of the recruiter's values counts than the candidate
   * keeping their list tight — the beta of an F-beta score. 1 weighs both
   * evenly; the default 2 weighs coverage 4x.
   */
  recallBias?: number;
  /** Weigh rare values above popular ones. Off falls back to plain counting. */
  useRarity?: boolean;
}

export interface ValueCategoryBreakdown {
  category: CategoryKey;
  /** 0-1 within this category alone, unrounded. */
  ratio: number;
  /** This category's share of the final ratio, 0-1. */
  influence: number;
  matched: string[];
  /** Recruiter values the candidate did not pick. */
  missing: string[];
  /** Candidate values the recruiter did not ask for. */
  extra: string[];
}

export interface ValueMatchResult {
  /**
   * 0-1, unrounded. Presentation is the pipeline's business — it applies
   * `RANKING_SCALE` and rounds, once, so nothing is lost to rounding on the way
   * through a weighted average.
   *
   * Zero is a real result — it means the recruiter named values and the
   * candidate shares none of them.
   */
  ratio: number;
  /**
   * False when the recruiter has no values on record. There is nothing to match
   * against, so `ratio` is meaningless and the caller should drop this signal
   * rather than average a zero into the ranking.
   */
  applicable: boolean;
  matched: string[];
  missing: string[];
  extra: string[];
  breakdown: ValueCategoryBreakdown[];
}

const DEFAULTS: Required<ValueMatchOptions> = { recallBias: 2, useRarity: true };

/**
 * Popularity -> weight, decaying but never reaching zero, so a value everyone
 * picks still counts for something. An unweighted value (a freshly seeded
 * catalog, where every weight is 0) scores 1 and the whole thing degrades
 * gracefully into plain counting.
 */
const rarityOf = (weight: number | undefined, useRarity: boolean): number => {
  if (!useRarity) return 1;
  const w = typeof weight === "number" && Number.isFinite(weight) && weight > 0 ? weight : 0;
  return 1 / Math.log2(2 + w);
};

const categoryOf = (value: MatchableValue): CategoryKey =>
  (value.type as VALUE_TYPE_ENUM) && String(value.type).trim() ? (value.type as VALUE_TYPE_ENUM) : UNTYPED;

/** Dedupes by id and drops entries without one. Later duplicates lose. */
const index = (values: MatchableValue[] | undefined | null): Map<string, MatchableValue> => {
  const byId = new Map<string, MatchableValue>();
  for (const value of values ?? []) {
    if (!value || value._id === null || value._id === undefined) continue;
    const id = String(value._id).trim();
    if (!id || byId.has(id)) continue;
    byId.set(id, value);
  }
  return byId;
};

/**
 * F-beta over the rarity mass of each side. Recall is how much of the
 * recruiter's mass the candidate covers, precision is how much of the
 * candidate's mass the recruiter asked for.
 */
const fBeta = (recall: number, precision: number, beta: number): number => {
  if (recall <= 0 || precision <= 0) return 0;
  const b2 = beta * beta;
  return ((1 + b2) * precision * recall) / (b2 * precision + recall);
};

const groupByCategory = (byId: Map<string, MatchableValue>): Map<CategoryKey, string[]> => {
  const groups = new Map<CategoryKey, string[]>();
  for (const [id, value] of byId) {
    const key = categoryOf(value);
    const bucket = groups.get(key);
    if (bucket) bucket.push(id);
    else groups.set(key, [id]);
  }
  return groups;
};

/**
 * Scores how well a candidate's values line up with the values of the recruiter
 * posting the job.
 *
 * Pure and synchronous — hand it already-populated values from either side; it
 * does no database work of its own.
 *
 * @param profileValues Candidate's `JobProfile.values`, populated.
 * @param recruiterValues Recruiter's `Tenant.values`, populated.
 */
export const matchValues = (
  profileValues: MatchableValue[] | undefined | null,
  recruiterValues: MatchableValue[] | undefined | null,
  options: ValueMatchOptions = {}
): ValueMatchResult => {
  const { recallBias, useRarity } = { ...DEFAULTS, ...options };

  const profileById = index(profileValues);
  const recruiterById = index(recruiterValues);

  const empty: ValueMatchResult = {
    ratio: 0,
    applicable: false,
    matched: [],
    missing: [],
    extra: [...profileById.keys()],
    breakdown: [],
  };

  // Nothing to match against — the recruiter never expressed any values.
  if (!recruiterById.size) return empty;

  // Same value id on both sides should carry the same weight; prefer whichever
  // record actually has one so a lean projection that dropped `weight` on one
  // side does not silently flatten rarity.
  const rarityById = new Map<string, number>();
  const rarityFor = (id: string): number => {
    const cached = rarityById.get(id);
    if (cached !== undefined) return cached;
    const source = recruiterById.get(id) ?? profileById.get(id);
    const mirror = profileById.get(id) ?? recruiterById.get(id);
    const weight = typeof source?.weight === "number" ? source.weight : mirror?.weight;
    const rarity = rarityOf(weight, useRarity);
    rarityById.set(id, rarity);
    return rarity;
  };

  const profileGroups = groupByCategory(profileById);
  const breakdown: ValueCategoryBreakdown[] = [];
  const matched: string[] = [];
  const missing: string[] = [];

  let weightedTotal = 0;
  let massTotal = 0;

  // Only categories the recruiter spoke to are scored.
  for (const [category, recruiterIds] of groupByCategory(recruiterById)) {
    const profileIds = profileGroups.get(category) ?? [];
    const profileSet = new Set(profileIds);

    const categoryMatched = recruiterIds.filter((id) => profileSet.has(id));
    const categoryMissing = recruiterIds.filter((id) => !profileSet.has(id));
    const matchedSet = new Set(categoryMatched);

    const sum = (ids: string[]): number => ids.reduce((total, id) => total + rarityFor(id), 0);

    const recruiterMass = sum(recruiterIds);
    const profileMass = sum(profileIds);
    const matchedMass = sum(categoryMatched);

    const recall = recruiterMass > 0 ? matchedMass / recruiterMass : 0;
    const precision = profileMass > 0 ? matchedMass / profileMass : 0;
    const ratio = fBeta(recall, precision, recallBias);

    matched.push(...categoryMatched);
    missing.push(...categoryMissing);

    breakdown.push({
      category,
      ratio,
      // Filled in below, once the total mass across categories is known.
      influence: recruiterMass,
      matched: categoryMatched,
      missing: categoryMissing,
      extra: profileIds.filter((id) => !matchedSet.has(id)),
    });

    // A category counts toward the final ratio in proportion to how much the
    // recruiter invested in it — more values, or rarer ones, pull harder.
    weightedTotal += ratio * recruiterMass;
    massTotal += recruiterMass;
  }

  for (const entry of breakdown) {
    entry.influence = massTotal > 0 ? Number((entry.influence / massTotal).toFixed(4)) : 0;
  }

  const matchedSet = new Set(matched);

  return {
    ratio: massTotal > 0 ? weightedTotal / massTotal : 0,
    applicable: true,
    matched,
    missing,
    // Everything the candidate picked that the recruiter did not ask for,
    // including values in categories the recruiter left empty entirely.
    extra: [...profileById.keys()].filter((id) => !matchedSet.has(id)),
    breakdown,
  };
};
