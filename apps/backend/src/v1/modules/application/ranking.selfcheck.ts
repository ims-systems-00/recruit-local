import assert from "node:assert";
import { QUERY_TYPE_ENUMS } from "@rl/types";
import { CRITERION_REGISTRY, computeRanking, RankingContext } from "./ranking.core";

/**
 * Pure-logic self-check (no DB). Run with:
 *   tsx apps/backend/src/v1/modules/application/ranking.selfcheck.ts
 */
const ctx = (over: Partial<RankingContext> = {}): RankingContext => ({
  jobValues: [],
  candidateValues: [],
  gradableQueries: [],
  answersByQuery: new Map(),
  requiredYears: undefined,
  candidateYears: 0,
  ...over,
});

const criterion = (key: string) => CRITERION_REGISTRY[key];

const demo = () => {
  // valueMatch: proportion of employer values the candidate holds
  assert.strictEqual(criterion("valueMatch").score(ctx({ jobValues: ["a", "b"], candidateValues: ["a", "b"] })), 1);
  assert.strictEqual(criterion("valueMatch").score(ctx({ jobValues: ["a", "b"], candidateValues: ["a"] })), 0.5);
  assert.strictEqual(criterion("valueMatch").score(ctx({ jobValues: [] })), null, "no employer values => N/A");

  // questionAnswers: choice exact-match + text fuzzy-match
  const q = (id: string, expectedAnswer: string, type: QUERY_TYPE_ENUMS) => ({ id, expectedAnswer, type });
  const answered = criterion("questionAnswers").score(
    ctx({
      gradableQueries: [
        q("1", "Yes", QUERY_TYPE_ENUMS.SINGLE_CHOICE),
        q("2", "team player", QUERY_TYPE_ENUMS.SHORT_ANSWER),
      ],
      answersByQuery: new Map<string, string>([
        ["1", "yes"],
        ["2", "I am a team player"],
      ]),
    })
  );
  assert.strictEqual(answered, 1, "both answers correct (choice exact + text contains)");
  const halfRight = criterion("questionAnswers").score(
    ctx({
      gradableQueries: [q("1", "Yes", QUERY_TYPE_ENUMS.SINGLE_CHOICE), q("2", "No", QUERY_TYPE_ENUMS.SINGLE_CHOICE)],
      answersByQuery: new Map<string, string>([
        ["1", "Yes"],
        ["2", "Yes"],
      ]),
    })
  );
  assert.strictEqual(halfRight, 0.5);
  assert.strictEqual(criterion("questionAnswers").score(ctx()), null, "no gradable questions => N/A");

  // experienceMatch: capped at 1, N/A when job requires none
  assert.strictEqual(criterion("experienceMatch").score(ctx({ requiredYears: 2, candidateYears: 1 })), 0.5);
  assert.strictEqual(criterion("experienceMatch").score(ctx({ requiredYears: 2, candidateYears: 5 })), 1, "capped");
  assert.strictEqual(criterion("experienceMatch").score(ctx({ requiredYears: 0 })), null);

  // computeRanking: full match => 100, no match => 0
  assert.strictEqual(
    computeRanking(
      ctx({
        jobValues: ["a"],
        candidateValues: ["a"],
        gradableQueries: [q("1", "Yes", QUERY_TYPE_ENUMS.SINGLE_CHOICE)],
        answersByQuery: new Map<string, string>([["1", "Yes"]]),
        requiredYears: 2,
        candidateYears: 4,
      })
    ).matchScore,
    100
  );
  assert.strictEqual(computeRanking(ctx({ jobValues: ["a"], candidateValues: [] })).matchScore, 0);

  // N/A criteria are EXCLUDED (not averaged as 0): only experience applies -> 50
  const naExcluded = computeRanking(ctx({ requiredYears: 2, candidateYears: 1 }));
  assert.strictEqual(naExcluded.matchScore, 50);
  assert.strictEqual(naExcluded.breakdown.length, 1, "only the applicable criterion appears in the breakdown");
  assert.strictEqual(naExcluded.breakdown[0].key, "experienceMatch");

  console.log("ranking self-check passed");
};

demo();
