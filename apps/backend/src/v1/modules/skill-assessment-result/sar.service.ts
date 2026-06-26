import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { IListParams, ListQueryParams } from "@rl/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { withTransaction } from "../../../common/helper/database-transaction";
import { skillAssessmentResultQuery } from "./sar.query";
import { IQuestion, ISkillAssessmentResultInput, SkillAssessmentResult } from "../../../models";
import * as skillAssessmentService from "../skill-assessment/skill-assessment.service";
import { QUESTION_TYPE_ENUM } from "@rl/types";

type IListSARParams = IListParams<ISkillAssessmentResultInput>;
type ISARQueryParams = ListQueryParams<ISkillAssessmentResultInput>;

export const list = ({ query = {}, options }: IListSARParams) => {
  return SkillAssessmentResult.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...skillAssessmentResultQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListSARParams) => {
  const results = await SkillAssessmentResult.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...skillAssessmentResultQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Skill Assessment Result not found.");
  return results[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListSARParams) => {
  return SkillAssessmentResult.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...skillAssessmentResultQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListSARParams) => {
  const results = await SkillAssessmentResult.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...skillAssessmentResultQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Skill Assessment Result not found in trash.");
  return results[0];
};

export const create = async (payload: ISkillAssessmentResultInput) => {
  return withTransaction<ISkillAssessmentResultInput>(async (session) => {
    const skillAssessment = await skillAssessmentService.getOne({
      query: { _id: payload.skillAssessmentId },
    });

    let totalScore = 0;

    // Only count questions that belong to this assessment
    skillAssessment.questions.forEach((question: IQuestion & { _id: string }) => {
      const qaPair = payload.answers.find(
        (ans: { questionId: string; answer: string }) => ans.questionId === question._id.toString()
      );

      if (qaPair) {
        let isCorrect = false;

        if (question.type === QUESTION_TYPE_ENUM.MULTIPLE_CHOICE || question.type === QUESTION_TYPE_ENUM.TRUE_FALSE) {
          if (qaPair.selectedOptionIndex === question.correctOptionIndex) {
            isCorrect = true;
          }
        } else if (question.type === QUESTION_TYPE_ENUM.SHORT_ANSWER) {
          // Placeholder for short answer logic
          isCorrect = false;
        }

        if (isCorrect) {
          totalScore += question.points;
        }
      }
    });

    payload.score = totalScore;
    payload.totalPossibleScore = skillAssessment.questions.reduce(
      (acc: number, question: IQuestion) => acc + question.points,
      0
    );

    const scorePercentage = (payload.score / (payload.totalPossibleScore || 1)) * 100;
    const recommendations: string[] = [];

    if (scorePercentage >= 80) {
      recommendations.push("Excellent performance! You have a strong understanding of the material.");
    } else if (scorePercentage >= 50) {
      recommendations.push("Good effort! Consider reviewing some areas to improve your knowledge.");
    } else {
      recommendations.push("Needs improvement. We recommend revisiting the study materials and practice more.");
    }
    payload.recommendations = recommendations;

    let skillAssessmentResult = new SkillAssessmentResult(payload);
    skillAssessmentResult = await skillAssessmentResult.save({ session });

    return skillAssessmentResult;
  });
};

export const update = async ({
  query,
  payload,
}: {
  query: ISARQueryParams;
  payload: Partial<ISkillAssessmentResultInput>;
}) => {
  const updatedResult = await SkillAssessmentResult.findOneAndUpdate(
    sanitizeQueryIds(query),
    { $set: payload },
    { new: true }
  );
  if (!updatedResult) throw new NotFoundException("Skill Assessment Result not found.");
  return updatedResult;
};

export const softRemove = async ({ query }: { query: ISARQueryParams }) => {
  const { deleted } = await SkillAssessmentResult.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Skill Assessment Result not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: ISARQueryParams }) => {
  const deletedResult = await SkillAssessmentResult.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedResult) throw new NotFoundException("Skill Assessment Result not found to delete.");
  return deletedResult;
};

export const restore = async ({ query }: { query: ISARQueryParams }) => {
  const { restored } = await SkillAssessmentResult.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Skill Assessment Result not found in trash.");
  return { restored };
};
