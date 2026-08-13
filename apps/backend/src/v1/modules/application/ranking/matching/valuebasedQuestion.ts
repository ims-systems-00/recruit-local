import { QUERY_TYPE_ENUMS } from "@rl/types";

/**
 * Screening-question matching.
 *
 * A recruiter building a job may attach additional queries — screening
 * questions — and give each one an answer key in `expectedAnswer`. The
 * candidate's replies arrive on the application as `{ queryId, answer }`, joined
 * back to the question by `Job.additionalQueries[]._id`. This grades one against
 * the other.
 *
 * Three things shape the score:
 *
 * 1. **Only keyed questions count.** A question with no `expectedAnswer` is not
 *    a question the recruiter has an opinion about, so it is dropped from the
 *    denominator rather than scored zero — the same reasoning that makes the
 *    value matcher skip categories the recruiter left empty. A job whose
 *    questions are all unkeyed makes this whole signal inapplicable.
 *
 * 2. **Required questions weigh double.** `isRequired` is the recruiter saying
 *    this one matters, so missing it costs more than missing an optional one —
 *    but it never zeroes the candidate outright. This is a ranking signal, not a
 *    screening gate.
 *
 * 3. **Partial credit on prose.** Choice questions are exact set work, but a
 *    paragraph can only be judged on how much of the answer key it covers. Free
 *    text is scored by term coverage, the same technique the CV entity matcher
 *    uses, so a right answer phrased differently still earns most of the marks.
 *
 * A keyed question the candidate left blank scores 0 and stays in the
 * denominator: the recruiter asked, and silence is not a pass.
 *
 * Nothing here reads the database — hand it the job's queries and the
 * application's answers, both already loaded.
 */

/**
 * The shape this matcher needs off a question. Deliberately loose so it accepts
 * a Mongoose subdocument, a `.lean()` result, or an aggregation projection
 * without the caller reshaping first. `_id` is `unknown` because it may arrive
 * as an `ObjectId` or as an already-stringified id.
 */
export interface MatchableQuery {
  _id?: unknown;
  type?: QUERY_TYPE_ENUMS | string;
  options?: string[];
  isRequired?: boolean;
  expectedAnswer?: string;
}

/** One candidate reply. `answer` is stored as `Mixed`, so it may be anything. */
export interface MatchableAnswer {
  queryId: unknown;
  answer?: string | string[] | number | boolean | null;
}

export interface QuestionMatchOptions {
  /** Mass carried by a question marked `isRequired`. Default 2. */
  requiredWeight?: number;
  /** Mass carried by an optional question. Default 1. */
  optionalWeight?: number;
  /**
   * Shortest word that counts as a term when scoring free text. Below this,
   * words are noise ("a", "in", "to") more often than signal. Default 3.
   */
  minTermLength?: number;
}

/**
 * One graded question. Carries no answer text on purpose: the matcher's result
 * travels in the ranking job's `returnvalue`, which is readable on the queue
 * board, and the answer key is a field candidates are not permitted to read.
 * Pairing it with a candidate's reply is not this code's business — the score is.
 */
export interface QuestionBreakdown {
  queryId: string;
  type: string | null;
  isRequired: boolean;
  /** This question's mass before normalization. */
  weight: number;
  /** 0-1 for this question alone, unrounded. */
  ratio: number;
  /** This question's share of the final ratio, 0-1. */
  influence: number;
  /** False when the candidate left it blank — scored 0, still counted. */
  answered: boolean;
}

export interface QuestionMatchResult {
  /**
   * 0-1, unrounded. Presentation is the pipeline's business — it applies
   * `RANKING_SCALE` and rounds, once.
   *
   * Zero is a real result: the recruiter keyed their questions and the candidate
   * matched none of them.
   */
  ratio: number;
  /**
   * False when no question could be graded — the job asked nothing, or asked
   * without ever saying what a right answer looks like. `ratio` is meaningless
   * then and the caller should drop this signal rather than average in a zero.
   */
  applicable: boolean;
  /** How many questions carried an answer key and were scored. */
  graded: number;
  /** How many were skipped for having none. */
  ungraded: number;
  /** Ids of graded questions the candidate left blank. */
  unanswered: string[];
  breakdown: QuestionBreakdown[];
}

const DEFAULTS: Required<QuestionMatchOptions> = { requiredWeight: 2, optionalWeight: 1, minTermLength: 3 };

/**
 * Lowercase, strip punctuation to spaces, collapse whitespace. Punctuation
 * becomes a space rather than nothing so "react/node" splits into two terms
 * instead of fusing into one.
 */
const normalize = (value: string): string =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const termsOf = (value: string, minTermLength: number): string[] =>
  normalize(value)
    .split(" ")
    .filter((term) => term.length >= minTermLength);

/**
 * Flattens a `Mixed` answer into the strings it actually contains. An empty
 * result means unanswered — note that `false` and `0` are answers, not blanks.
 */
const answerParts = (answer: MatchableAnswer["answer"]): string[] => {
  if (answer === null || answer === undefined) return [];
  const entries = Array.isArray(answer) ? answer : [answer];
  return entries.map((entry) => String(entry ?? "")).filter((entry) => entry.trim() !== "");
};

/**
 * F1 over two option sets. Balanced on purpose, unlike the recall-leaning value
 * matcher: here precision is a real signal, because a candidate who ticks every
 * box has not answered the question and must not score full marks for it.
 */
const f1 = (expected: Set<string>, given: Set<string>): number => {
  if (!expected.size || !given.size) return 0;

  let overlap = 0;
  for (const entry of given) if (expected.has(entry)) overlap += 1;
  if (!overlap) return 0;

  const recall = overlap / expected.size;
  const precision = overlap / given.size;
  return (2 * precision * recall) / (precision + recall);
};

/**
 * The recruiter UI stores a multi-select answer key as one comma-joined string,
 * so it has to be split back apart. The whole string is tried against the
 * declared options first, which rescues the case of a single expected option
 * that contains a comma of its own. An option containing a comma alongside
 * other expected options cannot be recovered — that is a limitation of the
 * stored shape, not of this parse.
 */
const expectedChoices = (expectedAnswer: string, options: string[] | undefined): Set<string> => {
  const whole = normalize(expectedAnswer);
  if (!whole) return new Set();

  const declared = new Set((options ?? []).map((option) => normalize(String(option ?? ""))).filter(Boolean));
  if (declared.has(whole)) return new Set([whole]);

  const parts = expectedAnswer
    .split(",")
    .map((part) => normalize(part))
    .filter(Boolean);

  return new Set(parts.length ? parts : [whole]);
};

/**
 * How much of the answer key the candidate's prose covers. Containment is a
 * clean pass — an answer that repeats the key verbatim needs no term counting,
 * and it is the only way to grade a key too short to yield terms of its own.
 */
const coverage = (expectedAnswer: string, answerText: string, minTermLength: number): number => {
  const expectedText = normalize(expectedAnswer);
  const givenText = normalize(answerText);
  if (!expectedText || !givenText) return 0;
  if (givenText.includes(expectedText)) return 1;

  const expectedTerms = [...new Set(termsOf(expectedAnswer, minTermLength))];
  if (!expectedTerms.length) return 0;

  const givenTerms = new Set(termsOf(answerText, minTermLength));
  const covered = expectedTerms.filter((term) => givenTerms.has(term)).length;
  return covered / expectedTerms.length;
};

/** Scores one answered question, 0-1. */
const gradeAnswer = (query: MatchableQuery, parts: string[], expectedAnswer: string, minTermLength: number): number => {
  const given = new Set(parts.map((part) => normalize(part)).filter(Boolean));

  switch (query.type) {
    // A single choice's key is one option verbatim, commas and all.
    case QUERY_TYPE_ENUMS.SINGLE_CHOICE:
      return f1(new Set([normalize(expectedAnswer)]), given);
    case QUERY_TYPE_ENUMS.MULTIPLE_CHOICE:
      return f1(expectedChoices(expectedAnswer, query.options), given);
    // Paragraph, short answer, and anything unrecognised: free prose.
    default:
      return coverage(expectedAnswer, parts.join(" "), minTermLength);
  }
};

/**
 * Scores a candidate's screening answers against the job's answer key.
 *
 * Pure and synchronous — hand it already-loaded documents; it does no database
 * work of its own.
 *
 * @param queries The job's `additionalQueries`.
 * @param answers The application's `answers`.
 */
export const matchQuestionAnswers = (
  queries: MatchableQuery[] | undefined | null,
  answers: MatchableAnswer[] | undefined | null,
  options: QuestionMatchOptions = {}
): QuestionMatchResult => {
  const { requiredWeight, optionalWeight, minTermLength } = { ...DEFAULTS, ...options };

  // Answers are keyed by the question's `_id`. Duplicates are malformed input;
  // the first one wins rather than the last, so grading is not order-dependent.
  const answerByQueryId = new Map<string, MatchableAnswer>();
  for (const entry of answers ?? []) {
    if (!entry || entry.queryId === null || entry.queryId === undefined) continue;
    const id = String(entry.queryId).trim();
    if (!id || answerByQueryId.has(id)) continue;
    answerByQueryId.set(id, entry);
  }

  const breakdown: QuestionBreakdown[] = [];
  const unanswered: string[] = [];
  let ungraded = 0;
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const query of queries ?? []) {
    if (!query) continue;

    const id = query._id === null || query._id === undefined ? "" : String(query._id).trim();
    const expectedAnswer = typeof query.expectedAnswer === "string" ? query.expectedAnswer : "";

    // No id to join an answer to, or no answer key: nothing to grade against.
    if (!id || !normalize(expectedAnswer)) {
      ungraded += 1;
      continue;
    }

    const parts = answerParts(answerByQueryId.get(id)?.answer);
    const answered = parts.length > 0;
    if (!answered) unanswered.push(id);

    const ratio = answered ? gradeAnswer(query, parts, expectedAnswer, minTermLength) : 0;
    const weight = Math.max(0, query.isRequired ? requiredWeight : optionalWeight);

    breakdown.push({
      queryId: id,
      type: query.type ? String(query.type) : null,
      isRequired: Boolean(query.isRequired),
      weight,
      ratio,
      // Filled in below, once the total mass across questions is known.
      influence: 0,
      answered,
    });

    weightedTotal += ratio * weight;
    weightTotal += weight;
  }

  for (const entry of breakdown) {
    entry.influence = weightTotal > 0 ? Number((entry.weight / weightTotal).toFixed(4)) : 0;
  }

  // The job asked nothing, or asked without ever keying an answer.
  if (weightTotal <= 0) return { ratio: 0, applicable: false, graded: 0, ungraded, unanswered, breakdown };

  return {
    ratio: weightedTotal / weightTotal,
    applicable: true,
    graded: breakdown.length,
    ungraded,
    unanswered,
    breakdown,
  };
};
