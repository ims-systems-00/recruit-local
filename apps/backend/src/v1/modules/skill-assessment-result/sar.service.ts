import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery } from "../../../common/query";
import { IListParams } from "@inrm/types";
import { skillAssessmentResultQuery } from "./sar.query";
import { IQuestion, ISkillAssessmentResultInput, SkillAssessmentResult } from "../../../models";
import * as skillAssessmentService from "../skill-assessment/skill-assessment.service";
import { QUESTION_TYPE_ENUM } from "@inrm/types";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";

type IListSkillAssessmentResultParams = IListParams<ISkillAssessmentResultInput>;

export const list = ({ query = {}, options }: IListSkillAssessmentResultParams) => {
  return SkillAssessmentResult.aggregatePaginate(
    [...matchQuery(query), ...excludeDeletedQuery(), ...skillAssessmentResultQuery()],
    options
  );
};

export const listWithSoftDeleted = ({ query = {}, options }: IListSkillAssessmentResultParams) => {
  return SkillAssessmentResult.aggregatePaginate([...matchQuery(query), ...skillAssessmentResultQuery()], options);
};

export const getOne = async (query = {}) => {
  const skillAssessmentResult = await SkillAssessmentResult.aggregate([
    ...matchQuery(query),
    ...excludeDeletedQuery(),
    ...skillAssessmentResultQuery(),
  ]);
  if (skillAssessmentResult.length === 0) throw new NotFoundException("Skill Assessment Result not found.");
  return skillAssessmentResult[0];
};

export const getSoftDeletedOne = async (query = {}) => {
  const skillAssessmentResult = await SkillAssessmentResult.aggregate([
    ...matchQuery(query),
    ...skillAssessmentResultQuery(),
  ]);
  if (skillAssessmentResult.length === 0) throw new NotFoundException("Skill Assessment Result not found in trash.");
  return skillAssessmentResult[0];
};

export const create = async (payload: ISkillAssessmentResultInput) => {
  // todo: probably move the scoring logic to a queue worker later recommendation and result could be compute intensive
  const skillAssessment = await skillAssessmentService.getOne({
    ...sanitizeQueryIds({ _id: payload.skillAssessmentId }),
  });

  let totalScore = 0;
  // only count the questions that belong to the assessment
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
        // For short answer, we can implement a more complex logic later
        isCorrect = false;
      }

      if (isCorrect) {
        totalScore += question.points;
      }
    }
  });

  payload.score = totalScore;
  payload.totalPossibleScore = skillAssessment.questions.reduce((acc, question: IQuestion) => acc + question.points, 0);

  // generate recommendations based on score percentage
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
  skillAssessmentResult = await skillAssessmentResult.save();

  return skillAssessmentResult;
};

export const update = async (id: string, payload: Partial<ISkillAssessmentResultInput>) => {
  const updatedSkillAssessmentResult = await SkillAssessmentResult.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedSkillAssessmentResult) throw new NotFoundException("Skill Assessment Result not found.");
  return updatedSkillAssessmentResult;
};

export const softRemove = async (id: string) => {
  const deletedSkillAssessmentResult = await SkillAssessmentResult.findOneAndUpdate(
    { _id: id },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!deletedSkillAssessmentResult) throw new NotFoundException("Skill Assessment Result not found.");
  return deletedSkillAssessmentResult;
};

export const restore = async (id: string) => {
  const restoredSkillAssessmentResult = await SkillAssessmentResult.findOneAndUpdate(
    { _id: id },
    { $set: { deletedAt: null } },
    { new: true }
  );
  if (!restoredSkillAssessmentResult) throw new NotFoundException("Skill Assessment Result not found in trash.");
  return restoredSkillAssessmentResult;
};

export const hardRemove = async (id: string) => {
  const skillAssessmentResult = await SkillAssessmentResult.findOneAndDelete({ _id: id });
  return skillAssessmentResult;
};
