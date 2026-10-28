import { Types } from "mongoose";
import {
  PROMPT_NAME,
  IValueAssessmentQuestion,
  IValueScoreAnswer,
  ValueScoreResponseDto,
  VALUE_TYPE_ENUM,
} from "@rl/types";
import { JobProfile, IValueScore } from "../../../models";
import { BadRequestException, ServiceUnavailableException, logger } from "../../../common/helper";
import { llm, AGENT_MODEL } from "../agent/llm/client";
import { resolvePrompt } from "../prompt/prompt.resolver";
import { enqueueProfileFeedRebuild } from "../../../queue/profileFeedRebuildQueue";
import {
  DEFAULT_VALUE_SCORE_SYSTEM_PROMPT,
  VALUE_SCORE_FEEDBACK_MAX_LENGTH,
  VALUE_SCORE_UNAVAILABLE_MESSAGE,
  buildValueScoreResponseFormat,
} from "./value-score.constants";

/**
 * Value self-evaluation: a candidate answers a value's three questions, the LLM
 * scores each answer against a rubric, and the mean lands on the job profile as
 * that value's score.
 *
 * Deliberately not gated on the value being in `profile.values`: onboarding only
 * saves the selection on Continue, so the value being evaluated is usually not
 * on the profile yet. The job-profile `update` prunes scores for values that are
 * later deselected.
 */

const VALUE_SCORE_MODEL = process.env.VALUE_SCORE_MODEL || AGENT_MODEL;

interface IEvaluateParams {
  value: { label: string; type: VALUE_TYPE_ENUM; heading: string };
  answers: IValueScoreAnswer[];
}

interface IValueEvaluation {
  score: number;
  feedback: string;
}

/**
 * Pairs submitted answers with the value's stored questions, in the stored
 * order, carrying the question text so the saved answer records what was asked.
 *
 * The body schema already checked the shape; this checks the keys against the
 * value itself, which the schema cannot see.
 */
export const matchAnswers = (
  questions: IValueAssessmentQuestion[],
  answers: { key: string; answer: string }[]
): IValueScoreAnswer[] => {
  const byKey = new Map(answers.map(({ key, answer }) => [key.trim(), answer.trim()]));
  if (byKey.size !== questions.length || questions.some(({ key }) => !byKey.has(key))) {
    throw new BadRequestException("Answer each of this value's questions.");
  }

  return questions.map(({ key, text }) => ({ key, question: text, answer: byKey.get(key) as string }));
};

const clampScore = (score: unknown): number | null =>
  typeof score === "number" && Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : null;

/**
 * Reads the model's reply into a score, or null if it is unusable. The overall
 * score is computed here from the per-answer scores — the model's own arithmetic
 * is never asked for, so it cannot be wrong.
 */
const parseEvaluation = (content: string | null | undefined, keys: string[]): IValueEvaluation | null => {
  if (!content) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return null;
  }

  const { answers, feedback } = (parsed ?? {}) as { answers?: unknown; feedback?: unknown };
  if (!Array.isArray(answers)) return null;

  const scores: number[] = [];
  for (const key of keys) {
    const entry = answers.find((answer) => answer && typeof answer === "object" && answer.key === key);
    const score = clampScore(entry?.score);
    if (score === null) return null;
    scores.push(score);
  }

  return {
    score: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    feedback: typeof feedback === "string" ? feedback.trim().slice(0, VALUE_SCORE_FEEDBACK_MAX_LENGTH) : "",
  };
};

/**
 * Scores one value's answers with the LLM.
 *
 * Throws 503 on any failure — network, refusal, malformed output — so the
 * caller saves nothing and the candidate can simply retry.
 */
export const evaluate = async ({ value, answers }: IEvaluateParams): Promise<IValueEvaluation> => {
  // Resolved per call so a published prompt revision applies without a restart.
  const systemPrompt = await resolvePrompt(PROMPT_NAME.VALUE_SCORE_SYSTEM, {
    fallback: DEFAULT_VALUE_SCORE_SYSTEM_PROMPT,
  });
  const keys = answers.map(({ key }) => key);

  let content: string | null | undefined;
  try {
    const response = await llm.chat.completions.create({
      model: VALUE_SCORE_MODEL,
      temperature: 0,
      response_format: buildValueScoreResponseFormat(keys),
      messages: [
        { role: "system", content: systemPrompt.content },
        {
          role: "user",
          content: JSON.stringify({ value: value.label, valueType: value.type, heading: value.heading, answers }),
        },
      ],
    });
    content = response.choices[0]?.message?.content;
  } catch (error) {
    logger.error("[valueScore] LLM call failed", {
      model: VALUE_SCORE_MODEL,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new ServiceUnavailableException(VALUE_SCORE_UNAVAILABLE_MESSAGE);
  }

  const evaluation = parseEvaluation(content, keys);
  if (!evaluation) {
    logger.warn("[valueScore] unusable LLM response", {
      model: VALUE_SCORE_MODEL,
      promptVersion: systemPrompt.version,
    });
    throw new ServiceUnavailableException(VALUE_SCORE_UNAVAILABLE_MESSAGE);
  }

  return evaluation;
};

/**
 * Writes one value's score onto the profile, replacing any earlier one.
 *
 * Replace-then-push rather than read-modify-write, so two concurrent saves for
 * the same value cannot leave two entries. If the push loses a race to another
 * push, the replace is retried once so the later evaluation still wins.
 */
export const save = async ({
  jobProfileId,
  valueId,
  score,
  feedback,
  answers,
}: {
  jobProfileId: string | Types.ObjectId;
  valueId: string | Types.ObjectId;
  score: number;
  feedback: string;
  answers: IValueScoreAnswer[];
}): Promise<ValueScoreResponseDto> => {
  const _id = new Types.ObjectId(String(jobProfileId));
  const value = new Types.ObjectId(String(valueId));
  const entry: IValueScore = { value, score, feedback, answers, evaluatedAt: new Date() };

  const replace = () => JobProfile.updateOne({ _id, "valueScores.value": value }, { $set: { "valueScores.$": entry } });

  const replaced = await replace();
  if (replaced.matchedCount === 0) {
    const pushed = await JobProfile.updateOne(
      { _id, "valueScores.value": { $ne: value } },
      { $push: { valueScores: entry } }
    );
    if (pushed.matchedCount === 0) await replace();
  }

  // A value score counts toward the job match but not toward the profile's
  // keywords, so the keyword-update chain that rebuilds the feed after a
  // profile edit never sees this write.
  await enqueueProfileFeedRebuild(_id);

  return {
    value: value.toString(),
    score: entry.score,
    feedback: entry.feedback,
    evaluatedAt: entry.evaluatedAt.toISOString(),
  };
};
