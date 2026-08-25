/**
 * Keyword matching.
 *
 * Both sides carry a `keywords[]` array built by the same tokenizer
 * (`common/helper/keywords.ts`) and kept fresh by `keyword-update-queue`, so a
 * match is exact set overlap on lowercased tokens — no string similarity, the
 * same shape of comparison as the value matcher.
 *
 * What the two sides are made of matters for reading the score:
 *
 * - **Job** — `title`, `category`, `employmentType`, `workplace`, plus any tags
 *   the recruiter typed. Small, and partly enum noise ("full", "time",
 *   "remote") that a profile only matches by coincidence.
 * - **Profile** — the names behind `jobTitle`, `industry` and `workMode`, plus
 *   the free-text `skills` and `interests` blobs.
 *
 * That `skills` blob is why this matcher is worth having: it is the only route
 * the ranking has to a candidate's actual skills, since `Job` carries no
 * required-skills field to compare against directly. Treat this as a coarse
 * skills signal rather than a precise one.
 *
 * Scored the same way as values, and for the same reason: the recruiter is
 * asking "how much of what this job is about does this candidate cover?", so
 * recall leads. Precision cannot be dropped, though. Values come from a fixed
 * catalog and cannot be inflated, but `keywords` is derived from free text the
 * candidate writes, so precision is the only thing standing between the score
 * and a profile that lists every term under the sun.
 *
 * Because the two vocabularies overlap without being the same, a good real
 * match lands nearer 0.6 than 1.0. That is expected. Ranking is relative and
 * every candidate for a given job is measured against the same job tokens.
 */

export interface KeywordMatchOptions {
  /**
   * How much more coverage of the job's keywords counts than the candidate
   * keeping their own list tight — the beta of an F-beta score. 1 weighs both
   * evenly; the default 2 weighs coverage 4x.
   */
  recallBias?: number;
}

export interface KeywordMatchResult {
  /**
   * 0-1, unrounded. Presentation is the pipeline's business — it applies
   * `RANKING_SCALE` and rounds, once.
   *
   * Zero is a real result: it means both sides had keywords and none of them
   * met.
   */
  ratio: number;
  /**
   * False only when one side has no keywords at all — there is nothing to
   * compare and `ratio` would be meaningless.
   *
   * Note this is deliberately *not* false for a zero overlap. Marking a
   * non-matching candidate inapplicable would drop the signal and reshare its
   * weight among the matchers that did run, which would rank them above an
   * otherwise identical candidate who matched a little. A miss has to cost
   * something.
   */
  applicable: boolean;
  /** Job keywords the candidate also carries. */
  matched: string[];
  /** Job keywords the candidate does not carry. */
  missing: string[];
  jobCount: number;
  profileCount: number;
}

const DEFAULTS: Required<KeywordMatchOptions> = { recallBias: 2 };

/**
 * Normalizes to a deduped lowercase set. The queue already writes lowercased
 * tokens, but recruiter-entered tags reach `Job.keywords` through a union that
 * preserves whatever was typed, so neither side can be assumed clean.
 */
const index = (keywords: string[] | undefined | null): Set<string> => {
  const tokens = new Set<string>();
  for (const keyword of keywords ?? []) {
    if (typeof keyword !== "string") continue;
    const token = keyword.trim().toLowerCase();
    if (token) tokens.add(token);
  }
  return tokens;
};

/**
 * F-beta over token counts. Recall is how much of the job's vocabulary the
 * candidate covers, precision is how much of the candidate's vocabulary the job
 * asked for.
 */
const fBeta = (recall: number, precision: number, beta: number): number => {
  if (recall <= 0 || precision <= 0) return 0;
  const b2 = beta * beta;
  return ((1 + b2) * precision * recall) / (b2 * precision + recall);
};

/**
 * Scores how well a candidate's keywords line up with the job's.
 *
 * Pure and synchronous — hand it both stored arrays; it does no database work of
 * its own.
 *
 * @param jobKeywords The job's `keywords`, as maintained by `keyword-update-queue`.
 * @param profileKeywords The candidate's `JobProfile.keywords`, likewise.
 */
export const matchKeywords = (
  jobKeywords: string[] | undefined | null,
  profileKeywords: string[] | undefined | null,
  options: KeywordMatchOptions = {}
): KeywordMatchResult => {
  const { recallBias } = { ...DEFAULTS, ...options };

  const jobTokens = index(jobKeywords);
  const profileTokens = index(profileKeywords);

  const empty: KeywordMatchResult = {
    ratio: 0,
    applicable: false,
    matched: [],
    missing: [...jobTokens],
    jobCount: jobTokens.size,
    profileCount: profileTokens.size,
  };

  // One side never produced any keywords, so there is no comparison to make.
  if (!jobTokens.size || !profileTokens.size) return empty;

  const matched: string[] = [];
  const missing: string[] = [];
  for (const token of jobTokens) {
    if (profileTokens.has(token)) matched.push(token);
    else missing.push(token);
  }

  const recall = matched.length / jobTokens.size;
  const precision = matched.length / profileTokens.size;

  return {
    ratio: fBeta(recall, precision, recallBias),
    applicable: true,
    matched,
    missing,
    jobCount: jobTokens.size,
    profileCount: profileTokens.size,
  };
};
