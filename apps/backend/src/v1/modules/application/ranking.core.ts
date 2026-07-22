import { QUERY_TYPE_ENUMS } from "@rl/types";
import { matchScore as textSimilarity } from "../../../common/helper/text-match";

/**
 * Application ranking — pure scoring logic (no DB). The IO layer that assembles a
 * RankingContext from Mongo lives in ranking.service.ts.
 *
 * Two seams keep this easy to change:
 *   - CRITERIA[]  -> add/remove a scoring signal by editing one array entry.
 *   - RANKERS{}   -> swap the whole algorithm via RANKING_STRATEGY env var.
 *
 * Each criterion scores 0..1, or `null` when it does not apply to this job
 * (e.g. no screening questions). Null criteria are excluded from the average
 * so an unused signal never penalizes a candidate.
 */

export type AnswerValue = string | string[] | number | boolean;

export interface RankingContext {
  jobValues: string[]; // employer (tenant) value ids, as strings
  candidateValues: string[]; // candidate profile value ids, as strings
  gradableQueries: { id: string; expectedAnswer: string; type: QUERY_TYPE_ENUMS }[];
  answersByQuery: Map<string, AnswerValue>;
  requiredYears?: number;
  candidateYears: number;
}

export interface CriterionDef {
  weight: number;
  score: (ctx: RankingContext) => number | null;
}

export interface Criterion extends CriterionDef {
  key: string;
}

export interface RankingResult {
  matchScore: number; // 0..100
  breakdown: { key: string; weight: number; percentage: number }[];
}

export type Ranker = (ctx: RankingContext, criteria: Criterion[]) => RankingResult;

const TEXT_ANSWER_THRESHOLD = 0.6;
const norm = (v: unknown) => String(v).trim().toLowerCase();

// --- Criterion definitions, keyed by name. Add a new signal here, then list its name in CRITERIA. ---
export const CRITERION_REGISTRY: Record<string, CriterionDef> = {
  valueMatch: {
    weight: 1, // ponytail: equal weights; move to env/job config when tuning is needed
    score: (ctx) => {
      if (!ctx.jobValues.length) return null;
      const owned = new Set(ctx.candidateValues);
      const hit = ctx.jobValues.filter((v) => owned.has(v)).length;
      return hit / ctx.jobValues.length;
    },
  },
  questionAnswers: {
    weight: 1,
    score: (ctx) => {
      if (!ctx.gradableQueries.length) return null;
      const correct = ctx.gradableQueries.filter((q) => {
        const answer = ctx.answersByQuery.get(q.id);
        if (answer === undefined) return false;
        const isChoice = q.type === QUERY_TYPE_ENUMS.SINGLE_CHOICE || q.type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE;
        if (isChoice) {
          const picked = Array.isArray(answer) ? answer.map(norm) : [norm(answer)];
          return picked.includes(norm(q.expectedAnswer));
        }
        const asText = Array.isArray(answer) ? answer.join(" ") : String(answer);
        return textSimilarity(asText, q.expectedAnswer) >= TEXT_ANSWER_THRESHOLD;
      }).length;
      return correct / ctx.gradableQueries.length;
    },
  },
  experienceMatch: {
    weight: 1,
    score: (ctx) => {
      if (!ctx.requiredYears) return null;
      return Math.min(ctx.candidateYears / ctx.requiredYears, 1);
    },
  },
};

// --- Active criteria, in order. Add or remove a signal by editing this list of names. ---
export const CRITERIA: string[] = ["valueMatch", "questionAnswers", "experienceMatch"];

const resolveCriteria = (names: string[]): Criterion[] =>
  names.map((key) => {
    const def = CRITERION_REGISTRY[key];
    if (!def) throw new Error(`Unknown ranking criterion: ${key}`);
    return { key, ...def };
  });

// --- Rankers: swap the whole system by registering a new one + RANKING_STRATEGY ---
const weightedRanker: Ranker = (ctx, criteria) => {
  const breakdown: RankingResult["breakdown"] = [];
  let weighted = 0;
  let totalWeight = 0;
  for (const c of criteria) {
    const s = c.score(ctx);
    if (s === null) continue;
    breakdown.push({ key: c.key, weight: c.weight, percentage: Math.round(s * 100) });
    weighted += s * c.weight;
    totalWeight += c.weight;
  }
  return { matchScore: totalWeight ? Math.round((weighted / totalWeight) * 100) : 0, breakdown };
};

export const RANKERS: Record<string, Ranker> = {
  weighted: weightedRanker,
};

const activeRanker = (): Ranker => RANKERS[process.env.RANKING_STRATEGY ?? "weighted"] ?? weightedRanker;

export const computeRanking = (ctx: RankingContext): RankingResult => activeRanker()(ctx, resolveCriteria(CRITERIA));
