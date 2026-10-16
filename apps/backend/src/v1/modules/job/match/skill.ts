import assert from "assert";
import { JOB_SKILL_LEVEL_ENUMS, JOB_SKILL_REQUIREMENT_ENUMS } from "@rl/types";
import { refId } from "./ref-id";

/**
 * Skill matching.
 *
 * A job's skills and a profile's skills are rows from the same skill catalogue,
 * rated on the same level scale, so a match is exact on the skill id and the
 * only judgement is how far the candidate's level falls short of the job's.
 *
 * Each of the job's skills earns a credit from 0 to 1:
 *
 * - **At or above the asked level** — full credit. Being over-qualified in a
 *   skill is never held against anyone.
 * - **Below it** — loses `SHORTFALL_PENALTY_PER_LEVEL` per level short.
 * - **Missing, where the job asks only for willingness to learn** — a little
 *   credit: the job said it would take a learner, the candidate just did not
 *   say they are one.
 * - **Missing otherwise** — nothing.
 *
 * Required skills weigh `REQUIREMENT_WEIGHT` more than preferred ones, and the
 * ratio is the weighted mean of the credits. Every input here is something the
 * candidate may read, so the result can be shown to them as it is.
 *
 * Pure and synchronous — hand it both sides' rows; it does no database work.
 */

/** Credit lost for each level a candidate is short of the asked level. */
const SHORTFALL_PENALTY_PER_LEVEL = 0.3;

/** Credit for a skill the candidate lacks when the job asks only for willingness to learn it. */
const MISSING_WILLING_TO_LEARN_CREDIT = 0.3;

/** How much one of the job's skills counts toward the ratio. */
const REQUIREMENT_WEIGHT: Record<JOB_SKILL_REQUIREMENT_ENUMS, number> = {
  [JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED]: 2,
  [JOB_SKILL_REQUIREMENT_ENUMS.PREFERRED]: 1,
};

/** `JOB_SKILL_LEVEL_ENUMS` is declared lowest to highest, so its order is the rank. */
const LEVEL_RANK = new Map<string, number>(Object.values(JOB_SKILL_LEVEL_ENUMS).map((level, rank) => [level, rank]));

const WILLING_TO_LEARN_RANK = LEVEL_RANK.get(JOB_SKILL_LEVEL_ENUMS.WILLING_TO_LEARN) as number;

/**
 * The shape this matcher needs off a skill row. Loose on purpose: `skill` may be
 * a bare id (a lean profile) or the populated catalogue entry (a job read
 * through `jobSkillsLookupQuery`).
 */
export interface MatchableSkillRow {
  skill?: unknown;
  level?: string;
}

export interface MatchableJobSkillRow extends MatchableSkillRow {
  requirement?: string;
}

export interface SkillMatchResult {
  /** 0-1, unrounded. Zero is a real result: the job names skills and the candidate has none of them. */
  ratio: number;
  /** False when the job names no skills it can be scored on, so there is nothing to match. */
  applicable: boolean;
}

/**
 * One of the job's skills, scored against the candidate's level in it. `have`
 * is `null` when the candidate does not list the skill at all.
 */
export const skillCredit = (askedRank: number, haveRank: number | null): number => {
  if (haveRank === null) return askedRank === WILLING_TO_LEARN_RANK ? MISSING_WILLING_TO_LEARN_CREDIT : 0;
  const shortBy = askedRank - haveRank;
  return shortBy <= 0 ? 1 : Math.max(0, 1 - SHORTFALL_PENALTY_PER_LEVEL * shortBy);
};

/**
 * The candidate's level in each skill, by skill id. A row with no usable id or
 * an unknown level is skipped. Not an array — a profile not yet migrated off
 * the old free-text `skills` — reads as no skills.
 */
const indexProfileSkills = (rows: unknown): Map<string, number> => {
  const byId = new Map<string, number>();
  if (!Array.isArray(rows)) return byId;

  for (const row of rows as MatchableSkillRow[]) {
    const id = refId(row?.skill);
    const rank = LEVEL_RANK.get(String(row?.level));
    if (id === null || rank === undefined) continue;
    // The validator allows one row per skill; should two slip through, the better one counts.
    byId.set(id, Math.max(rank, byId.get(id) ?? -1));
  }

  return byId;
};

/**
 * Scores how well a candidate's skills cover a job's.
 *
 * Both sides are typed `unknown` because a stored document cannot be trusted to
 * hold rows: anything that is not an array reads as no skills.
 *
 * @param jobSkills The job's `skills` rows (`MatchableJobSkillRow[]`).
 * @param profileSkills The candidate's `JobProfile.skills` rows (`MatchableSkillRow[]`).
 */
export const matchSkills = (jobSkills: unknown, profileSkills: unknown): SkillMatchResult => {
  const have = indexProfileSkills(profileSkills);
  const seen = new Set<string>();

  let weighted = 0;
  let totalWeight = 0;

  for (const row of Array.isArray(jobSkills) ? (jobSkills as MatchableJobSkillRow[]) : []) {
    const id = refId(row?.skill);
    const askedRank = LEVEL_RANK.get(String(row?.level));
    const weight = REQUIREMENT_WEIGHT[row?.requirement as JOB_SKILL_REQUIREMENT_ENUMS];
    // A row that cannot be scored is skipped rather than counted as a miss, and
    // a repeated skill counts once.
    if (id === null || askedRank === undefined || weight === undefined || seen.has(id)) continue;
    seen.add(id);

    weighted += weight * skillCredit(askedRank, have.get(id) ?? null);
    totalWeight += weight;
  }

  if (totalWeight === 0) return { ratio: 0, applicable: false };
  return { ratio: weighted / totalWeight, applicable: true };
};

// Runnable check for the scoring rules. No database or Redis is touched.
// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/job/match/skill.ts
const demo = () => {
  const { WILLING_TO_LEARN, BEGINNER, INTERMEDIATE, ADVANCED } = JOB_SKILL_LEVEL_ENUMS;
  const { REQUIRED, PREFERRED } = JOB_SKILL_REQUIREMENT_ENUMS;
  const close = (actual: number, expected: number) => Math.abs(actual - expected) < 1e-9;

  assert(skillCredit(2, 3) === 1, "over the asked level is full credit");
  assert(close(skillCredit(3, 2), 0.7), "one level short loses 0.3");
  assert(close(skillCredit(3, 0), 0.1), "three levels short keeps 0.1");
  assert(skillCredit(1, null) === 0, "a missing skill earns nothing");
  assert(close(skillCredit(0, null), 0.3), "a missing willing-to-learn skill earns 0.3");

  // The worked example: React (req, advanced) vs intermediate, TypeScript (req,
  // intermediate) vs advanced, GraphQL (pref, beginner) missing, Figma (pref,
  // willing to learn) missing -> (2*0.7 + 2*1 + 0 + 0.3) / 6.
  const job = [
    { skill: { _id: "react", name: "React" }, level: ADVANCED, requirement: REQUIRED },
    { skill: { _id: "ts", name: "TypeScript" }, level: INTERMEDIATE, requirement: REQUIRED },
    { skill: { _id: "gql", name: "GraphQL" }, level: BEGINNER, requirement: PREFERRED },
    { skill: { _id: "figma", name: "Figma" }, level: WILLING_TO_LEARN, requirement: PREFERRED },
  ];
  const profile = [
    { skill: "react", level: INTERMEDIATE },
    { skill: "ts", level: ADVANCED },
    { skill: "node", level: ADVANCED },
  ];
  const example = matchSkills(job, profile);
  assert(example.applicable && close(example.ratio, 3.7 / 6), "worked example scores 3.7 / 6");

  assert(!matchSkills([], profile).applicable, "a job with no skills is not applicable");
  assert(!matchSkills(undefined, profile).applicable, "a job missing skills is not applicable");
  const none = matchSkills(job, []);
  assert(none.applicable && close(none.ratio, 0.3 / 6), "no profile skills still scores the willing-to-learn row");
  assert(close(matchSkills(job, "react, typescript").ratio, 0.3 / 6), "legacy free-text skills read as none");
  assert(close(matchSkills([job[0], job[0]], profile).ratio, 0.7), "a repeated job skill counts once");
  assert(
    close(matchSkills([{ skill: null, level: ADVANCED, requirement: REQUIRED }, job[1]], profile).ratio, 1),
    "a row with no skill id is skipped"
  );

  console.log("skill match self-check ok");
};

if (require.main === module) demo();
