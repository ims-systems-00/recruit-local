import assert from "assert";
import { JOB_SKILL_REQUIREMENT_ENUMS, QUERY_TYPE_ENUMS } from "@rl/types";
import { refId } from "../../../job/match/ref-id";
import {
  LEVEL_RANK,
  MatchableJobSkillRow,
  WILLING_TO_LEARN_RANK,
  indexProfileSkills,
} from "../../../job/match/skill";
import {
  MatchableAnswer,
  MatchableQuery,
  answerParts,
  expectedChoices,
  indexAnswers,
  normalize,
  queryIdOf,
} from "./valuebasedQuestion";

/** Each must-have miss multiplies the ranking score by this. */
export const MUST_HAVE_MISS_FACTOR = 0.5;

/** Levels short of a required skill that count as not having it. */
const SKILL_SHORTFALL_MISS = 2;

export interface MustHaveResult {
  /** Ids of required skills the candidate lacks or is too far below. */
  missingSkills: string[];
  /** Ids of knockout questions answered wrongly or left blank. */
  failedKnockouts: string[];
  /** 1 when nothing is missed, halved per miss. */
  factor: number;
}

/** Ids of the job's required skills the candidate is missing or 2+ levels short of. */
export const findMissingRequiredSkills = (jobSkills: unknown, profileSkills: unknown): string[] => {
  const have = indexProfileSkills(profileSkills);
  const seen = new Set<string>();
  const missing: string[] = [];

  for (const row of Array.isArray(jobSkills) ? (jobSkills as MatchableJobSkillRow[]) : []) {
    const id = refId(row?.skill);
    const askedRank = LEVEL_RANK.get(String(row?.level));
    if (id === null || askedRank === undefined || seen.has(id)) continue;
    seen.add(id);
    // the job said it takes learners, so lacking it isn't a dealbreaker
    if (row?.requirement !== JOB_SKILL_REQUIREMENT_ENUMS.REQUIRED || askedRank === WILLING_TO_LEARN_RANK) continue;

    const haveRank = have.get(id);
    if (haveRank === undefined || askedRank - haveRank >= SKILL_SHORTFALL_MISS) missing.push(id);
  }

  return missing;
};

const passesKnockout = (query: MatchableQuery, expectedAnswer: string, parts: string[]): boolean => {
  const given = new Set(parts.map(normalize).filter(Boolean));
  if (query.type === QUERY_TYPE_ENUMS.SINGLE_CHOICE) return given.has(normalize(expectedAnswer));
  // extra ticks are fine, every expected option must be there
  return [...expectedChoices(expectedAnswer, query.options)].every((choice) => given.has(choice));
};

/** Ids of knockout questions the candidate failed. Only keyed choice questions can be knockouts. */
export const findFailedKnockouts = (
  queries: MatchableQuery[] | undefined | null,
  answers: MatchableAnswer[] | undefined | null
): string[] => {
  const answerByQueryId = indexAnswers(answers);
  const failed: string[] = [];

  for (const query of queries ?? []) {
    if (!query?.isKnockout) continue;
    const id = queryIdOf(query);
    const expectedAnswer = typeof query.expectedAnswer === "string" ? query.expectedAnswer : "";
    const isChoice = query.type === QUERY_TYPE_ENUMS.SINGLE_CHOICE || query.type === QUERY_TYPE_ENUMS.MULTIPLE_CHOICE;
    if (!id || !isChoice || !normalize(expectedAnswer)) continue;

    const parts = answerParts(answerByQueryId.get(id)?.answer);
    if (!parts.length || !passesKnockout(query, expectedAnswer, parts)) failed.push(id);
  }

  return failed;
};

/** Every must-have the candidate misses, and the factor their score is multiplied by. */
export const matchMustHaves = (
  jobSkills: unknown,
  profileSkills: unknown,
  queries: MatchableQuery[] | undefined | null,
  answers: MatchableAnswer[] | undefined | null
): MustHaveResult => {
  const missingSkills = findMissingRequiredSkills(jobSkills, profileSkills);
  const failedKnockouts = findFailedKnockouts(queries, answers);
  const factor = MUST_HAVE_MISS_FACTOR ** (missingSkills.length + failedKnockouts.length);
  return { missingSkills, failedKnockouts, factor };
};

// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/application/ranking/matching/must-have.ts
const demo = () => {
  const job = [
    { skill: { _id: "react" }, level: "advanced", requirement: "required" },
    { skill: { _id: "ts" }, level: "intermediate", requirement: "required" },
    { skill: { _id: "docker" }, level: "advanced", requirement: "required" },
    { skill: { _id: "figma" }, level: "willing-to-learn", requirement: "required" },
    { skill: { _id: "gql" }, level: "advanced", requirement: "preferred" },
  ];
  const profile = [
    { skill: "react", level: "intermediate" },
    { skill: "docker", level: "beginner" },
  ];
  assert.deepStrictEqual(
    findMissingRequiredSkills(job, profile),
    ["ts", "docker"],
    "1 level short is fine, absent or 2+ short is a miss, willing-to-learn and preferred never are"
  );
  assert.deepStrictEqual(findMissingRequiredSkills([job[0], job[0]], []), ["react"], "a repeated skill counts once");
  assert.deepStrictEqual(findMissingRequiredSkills(undefined, profile), [], "no job skills, no misses");

  const queries: MatchableQuery[] = [
    { _id: "rtw", type: "single_choice", options: ["Yes", "No"], expectedAnswer: "Yes", isKnockout: true },
    { _id: "days", type: "multiple_choice", options: ["Mon", "Tue", "Wed"], expectedAnswer: "Mon,Tue", isKnockout: true },
    { _id: "shift", type: "single_choice", options: ["Day", "Night"], expectedAnswer: "Night" },
    { _id: "why", type: "paragraph", expectedAnswer: "teamwork", isKnockout: true },
    { _id: "nokey", type: "single_choice", options: ["A"], isKnockout: true },
  ];
  assert.deepStrictEqual(
    findFailedKnockouts(queries, [
      { queryId: "rtw", answer: "yes" },
      { queryId: "days", answer: ["Mon", "Tue", "Wed"] },
      { queryId: "shift", answer: "Day" },
    ]),
    [],
    "right answers pass, extra ticks pass, non-knockouts, prose and unkeyed questions are ignored"
  );
  assert.deepStrictEqual(
    findFailedKnockouts(queries, [
      { queryId: "rtw", answer: "No" },
      { queryId: "days", answer: ["Mon"] },
    ]),
    ["rtw", "days"],
    "a wrong choice or a missing expected option fails"
  );
  assert.deepStrictEqual(findFailedKnockouts(queries, []), ["rtw", "days"], "a blank knockout fails");

  const result = matchMustHaves(job, profile, queries, [{ queryId: "days", answer: ["Mon", "Tue"] }]);
  assert.deepStrictEqual(result.missingSkills, ["ts", "docker"]);
  assert.deepStrictEqual(result.failedKnockouts, ["rtw"]);
  assert(result.factor === 0.125, "three misses: 0.5^3");
  assert(matchMustHaves([], [], [], []).factor === 1, "nothing to miss, no penalty");

  console.log("must-have self-check ok");
};

if (require.main === module) demo();
