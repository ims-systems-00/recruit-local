import { buildKeywords } from "../../../../../common/helper/keywords";

/**
 * Skill matching.
 *
 * The question this answers is "how much of what this job is about does the
 * candidate actually demonstrate?" — and unlike the value matcher, the two sides
 * never picked from a shared catalog, so there are no ids to intersect. What
 * they do share is a tokenizer: `Job.keywords` and `JobProfile.keywords` are
 * both built by `buildKeywords`, so running the same function over the job's
 * remaining text puts every comparison in one vocabulary by construction.
 *
 * Three things make this more than a set intersection:
 *
 * 1. **The job's own tokens are not equal.** A token from the title is what the
 *    role *is*; a token from `employmentType` is an administrative detail that
 *    almost every candidate matches. Weighting by where a token came from stops
 *    "full", "time" and "remote" carrying the same mass as "react".
 *
 * 2. **Evidence has strength.** A skill the candidate recorded at *advanced* is
 *    better evidence than a token that fell out of their profile's job-title
 *    reference. Both count; they do not count the same.
 *
 * 3. **Near matches count, at a discount.** `buildKeywords` splits on
 *    non-alphanumerics, so "Node.js" tokenizes to "node" while a recruiter
 *    typing "nodejs" gets one token. Requiring an exact string would throw that
 *    match away. Containment recovers it — the same allowance
 *    `cv-match.service.ts` makes — but only between tokens long enough that
 *    containment means something, since "art" inside "started" is a coincidence.
 *
 * Like the value matcher the score is recall-leaning: covering what the job
 * asked for matters more than the candidate keeping their list short. A
 * precision term is still blended in, otherwise listing two hundred skills would
 * score full marks against every job on the platform.
 *
 * Nothing here reads the database — hand it the job and the candidate's
 * already-loaded skills and keywords.
 */

/**
 * The shape this matcher needs off the job. Deliberately loose so it accepts a
 * Mongoose document, a `.lean()` result, or an aggregation projection without
 * the caller reshaping first.
 */
export interface MatchableJob {
  title?: string | null;
  category?: string | null;
  employmentType?: string | null;
  workplace?: string | null;
  keywords?: string[] | null;
}

/** One row of the candidate's `Skill` collection. */
export interface MatchableSkill {
  name?: string | null;
  /** Free-form on the schema, so anything outside `PROFICIENCY` reads as unstated. */
  proficiencyLevel?: string | null;
}

/**
 * How much a job token counts for, by where it came from. The title is what the
 * role is; `employmentType` and `workplace` are filters nearly everyone passes.
 *
 * `Job.keywords` already folds in the title, category, employment type and
 * workplace (see `recomputeJobKeywords`), so most tokens arrive from more than
 * one source. The strongest source wins rather than the last one read, which is
 * what keeps a title token at 3 instead of being flattened to 2.
 */
export const JOB_TERM_WEIGHTS = { title: 3, keyword: 2, category: 2, attribute: 1 } as const;

/** How strong a piece of candidate evidence is, by where it came from. */
export const SKILL_PROFICIENCY_WEIGHTS: Record<string, number> = {
  native: 1,
  advanced: 1,
  intermediate: 0.8,
  beginner: 0.6,
};

/**
 * A recorded skill with no usable `proficiencyLevel`. Sits just under
 * *intermediate*: the candidate took the trouble to list it, which is worth more
 * than a token derived from their profile, but they never said how well they
 * know it.
 */
export const SKILL_DEFAULT_WEIGHT = 0.8;

/**
 * A token from `JobProfile.keywords`. Weaker on purpose — those are derived from
 * catalog references and free-text interests, so they say the candidate is
 * adjacent to a subject, not that they can do it.
 */
export const PROFILE_KEYWORD_WEIGHT = 0.5;

export interface SkillMatchOptions {
  /**
   * How much more covering the job's vocabulary counts than the candidate
   * keeping their list tight — the beta of an F-beta score. 1 weighs both
   * evenly; the default 2 weighs coverage 4x, matching the value matcher.
   */
  recallBias?: number;
  /**
   * Credit for a containment match ("node" against "nodejs") relative to an
   * exact one. Default 0.8.
   */
  nearMatchCredit?: number;
  /**
   * Shortest token that may match by containment. Below this, one token sitting
   * inside another is coincidence rather than meaning. Default 4.
   */
  minContainmentLength?: number;
}

/** One job token and how well the candidate answered it. */
export interface SkillTokenBreakdown {
  token: string;
  /** The token's mass before normalization — see `JOB_TERM_WEIGHTS`. */
  weight: number;
  /** Strength of the evidence covering it, 0-1. Zero means nothing matched. */
  coverage: number;
  /** This token's share of the job's total mass, 0-1. */
  influence: number;
  /** Candidate tokens that answered it, exact or by containment. */
  via: string[];
}

export interface SkillMatchResult {
  /**
   * 0-1, unrounded. Presentation is the pipeline's business — it applies
   * `RANKING_SCALE` and rounds, once.
   *
   * Zero is a real result: the job named a vocabulary and the candidate's skills
   * and keywords answered none of it.
   */
  ratio: number;
  /**
   * False when the comparison cannot be made: the job's text yields no tokens,
   * or the candidate has neither skills nor keywords on record. `ratio` is
   * meaningless then and the caller should drop this signal rather than average
   * in a zero.
   *
   * Note the second half is deliberately kinder than the value matcher, which
   * scores an empty candidate zero. A candidate with no `Skill` rows has usually
   * not filled that section in yet, and this matcher carries too much weight to
   * bury them on an absence rather than a mismatch.
   */
  applicable: boolean;
  /** Job tokens the candidate covered, strongest first. */
  matched: string[];
  /** Job tokens nothing answered. */
  missing: string[];
  /** Candidate tokens the job had no use for. */
  extra: string[];
  breakdown: SkillTokenBreakdown[];
}

const DEFAULTS: Required<SkillMatchOptions> = { recallBias: 2, nearMatchCredit: 0.8, minContainmentLength: 4 };

/** Token -> how much it is worth on whichever side it came from. */
type WeightedTokens = Map<string, number>;

/**
 * Files each token at `weight`, keeping the strongest claim when the same token
 * arrives from two sources. Max rather than last-write-wins makes the result
 * independent of the order sources are added.
 */
const claim = (bag: WeightedTokens, tokens: Iterable<string>, weight: number): void => {
  for (const token of tokens) {
    const current = bag.get(token);
    if (current === undefined || weight > current) bag.set(token, weight);
  }
};

const addTokens = (bag: WeightedTokens, parts: (string | null | undefined)[], weight: number): void =>
  claim(bag, buildKeywords(parts), weight);

/** The job's weighted vocabulary — everything the role says about itself. */
const jobVocabulary = (job: MatchableJob | null | undefined): WeightedTokens => {
  const bag: WeightedTokens = new Map();
  if (!job) return bag;

  // Employment type and workplace have to be demoted by name rather than by
  // source. `recomputeJobKeywords` folds them into `Job.keywords` alongside the
  // real subject matter, so claiming them at the keyword weight first would
  // floor "full", "time" and "remote" at 2 and the demotion would never happen.
  const administrative = new Set(buildKeywords([job.employmentType, job.workplace]));
  const keywords = buildKeywords(job.keywords ?? []);

  addTokens(bag, [job.title], JOB_TERM_WEIGHTS.title);
  addTokens(bag, [job.category], JOB_TERM_WEIGHTS.category);

  claim(
    bag,
    keywords.filter((token) => !administrative.has(token)),
    JOB_TERM_WEIGHTS.keyword
  );
  claim(bag, administrative, JOB_TERM_WEIGHTS.attribute);

  // A title that genuinely says "Remote" keeps its 3 — `claim` never lowers an
  // existing weight, so the demotion only bites tokens with nowhere better to
  // come from.
  return bag;
};

const strengthOf = (proficiency: string | null | undefined): number => {
  const key = String(proficiency ?? "")
    .trim()
    .toLowerCase();
  return SKILL_PROFICIENCY_WEIGHTS[key] ?? SKILL_DEFAULT_WEIGHT;
};

/** Everything the candidate can point at, weighted by how good the evidence is. */
const candidateEvidence = (
  skills: MatchableSkill[] | null | undefined,
  profileKeywords: string[] | null | undefined
): WeightedTokens => {
  const bag: WeightedTokens = new Map();

  addTokens(bag, profileKeywords ?? [], PROFILE_KEYWORD_WEIGHT);

  // Added second so a listed skill outranks the same token derived from the
  // profile — `addTokens` keeps the stronger of the two either way.
  for (const skill of skills ?? []) {
    if (!skill?.name) continue;
    addTokens(bag, [skill.name], strengthOf(skill.proficiencyLevel));
  }

  return bag;
};

/**
 * How strongly the candidate's evidence answers one job token, and which of
 * their tokens did it.
 *
 * An exact match takes the evidence at face value and short-circuits, so the
 * common case never walks the map. Otherwise every containment relation is
 * collected — the best one sets the score, but all of them count as relevant
 * for precision, since a token that matched something is a token the job had a
 * use for.
 */
const cover = (
  jobToken: string,
  evidence: WeightedTokens,
  nearMatchCredit: number,
  minContainmentLength: number
): { strength: number; via: string[] } => {
  const exact = evidence.get(jobToken);
  if (exact !== undefined) return { strength: exact, via: [jobToken] };

  if (jobToken.length < minContainmentLength) return { strength: 0, via: [] };

  let strength = 0;
  const via: string[] = [];

  for (const [token, evidenceStrength] of evidence) {
    if (token.length < minContainmentLength) continue;
    if (!token.includes(jobToken) && !jobToken.includes(token)) continue;

    via.push(token);
    const credited = evidenceStrength * nearMatchCredit;
    if (credited > strength) strength = credited;
  }

  return { strength, via };
};

/**
 * F-beta over the mass of each side. Recall is how much of the job's vocabulary
 * the candidate covers, precision is how much of the candidate's evidence the
 * job had a use for.
 */
const fBeta = (recall: number, precision: number, beta: number): number => {
  if (recall <= 0 || precision <= 0) return 0;
  const b2 = beta * beta;
  return ((1 + b2) * precision * recall) / (b2 * precision + recall);
};

/**
 * Scores how well a candidate's skills and profile keywords answer what a job
 * says about itself.
 *
 * Pure and synchronous — hand it already-loaded documents; it does no database
 * work of its own.
 *
 * @param job The job applied to.
 * @param skills The candidate's `Skill` rows.
 * @param profileKeywords The candidate's `JobProfile.keywords`.
 */
export const matchSkills = (
  job: MatchableJob | null | undefined,
  skills: MatchableSkill[] | null | undefined,
  profileKeywords: string[] | null | undefined,
  options: SkillMatchOptions = {}
): SkillMatchResult => {
  const { recallBias, nearMatchCredit, minContainmentLength } = { ...DEFAULTS, ...options };

  const vocabulary = jobVocabulary(job);
  const evidence = candidateEvidence(skills, profileKeywords);

  const empty: SkillMatchResult = {
    ratio: 0,
    applicable: false,
    matched: [],
    missing: [...vocabulary.keys()],
    extra: [...evidence.keys()],
    breakdown: [],
  };

  // The job's text yields nothing to match against, or the candidate has
  // recorded nothing to match with.
  if (!vocabulary.size || !evidence.size) return empty;

  const breakdown: SkillTokenBreakdown[] = [];
  const matched: string[] = [];
  const missing: string[] = [];
  // Candidate tokens that answered at least one job token, for precision.
  const used = new Set<string>();

  let weightedTotal = 0;
  let massTotal = 0;

  for (const [token, weight] of vocabulary) {
    const { strength, via } = cover(token, evidence, nearMatchCredit, minContainmentLength);

    if (strength > 0) {
      matched.push(token);
      for (const source of via) used.add(source);
    } else {
      missing.push(token);
    }

    breakdown.push({
      token,
      weight,
      coverage: strength,
      // Filled in below, once the job's total mass is known.
      influence: weight,
      via,
    });

    weightedTotal += strength * weight;
    massTotal += weight;
  }

  for (const entry of breakdown) {
    entry.influence = massTotal > 0 ? Number((entry.influence / massTotal).toFixed(4)) : 0;
  }

  // Strongest-covered job tokens first, so the head of `matched` is the part of
  // the score worth showing a recruiter.
  const coverageByToken = new Map(breakdown.map((entry) => [entry.token, entry.coverage * entry.weight]));
  matched.sort((a, b) => (coverageByToken.get(b) ?? 0) - (coverageByToken.get(a) ?? 0));

  let evidenceMass = 0;
  let usedMass = 0;
  for (const [token, strength] of evidence) {
    evidenceMass += strength;
    if (used.has(token)) usedMass += strength;
  }

  const recall = massTotal > 0 ? weightedTotal / massTotal : 0;
  const precision = evidenceMass > 0 ? usedMass / evidenceMass : 0;

  return {
    ratio: fBeta(recall, precision, recallBias),
    applicable: true,
    matched,
    missing,
    extra: [...evidence.keys()].filter((token) => !used.has(token)),
    breakdown,
  };
};
