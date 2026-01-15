import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery } from "../../../common/query";
import { IListParams } from "@inrm/types";
import { skillAssessmentProjectionQuery } from "./skill-assessment.query";
import { ISkillAssessmentInput, SkillAssessment } from "../../../models";

type IListSkillAssessmentParams = IListParams<ISkillAssessmentInput>;

export const list = ({ query = {}, options }: IListSkillAssessmentParams) => {
  return SkillAssessment.aggregatePaginate(
    [...matchQuery(query), ...excludeDeletedQuery(), ...skillAssessmentProjectionQuery()],
    options
  );
};

export const listWithSoftDeleted = ({ query = {}, options }: IListSkillAssessmentParams) => {
  return SkillAssessment.aggregatePaginate([...matchQuery(query), ...skillAssessmentProjectionQuery()], options);
};

export const getOne = async (query = {}) => {
  const skillAssessment = await SkillAssessment.aggregate([
    ...matchQuery(query),
    ...excludeDeletedQuery(),
    ...skillAssessmentProjectionQuery(),
  ]);
  if (skillAssessment.length === 0) throw new NotFoundException("Skill Assessment not found.");
  return skillAssessment[0];
};

export const getSoftDeletedOne = async (query = {}) => {
  const skillAssessment = await SkillAssessment.aggregate([...matchQuery(query), ...skillAssessmentProjectionQuery()]);
  if (skillAssessment.length === 0) throw new NotFoundException("Skill Assessment not found in trash.");
  return skillAssessment[0];
};

export const create = async (payload: ISkillAssessmentInput) => {
  let skillAssessment = new SkillAssessment(payload);
  skillAssessment = await skillAssessment.save();

  return skillAssessment;
};

export const update = async (id: string, payload: Partial<ISkillAssessmentInput>) => {
  const updatedSkillAssessment = await SkillAssessment.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedSkillAssessment) throw new NotFoundException("Skill Assessment not found.");
  return updatedSkillAssessment;
};

export const softRemove = async (id: string) => {
  const deletedSkillAssessment = await SkillAssessment.findOneAndUpdate(
    { _id: id },
    { $set: { deletedAt: new Date() } },
    { new: true }
  );
  if (!deletedSkillAssessment) throw new NotFoundException("Skill Assessment not found.");
  return deletedSkillAssessment;
};

export const restore = async (id: string) => {
  const restoredSkillAssessment = await SkillAssessment.findOneAndUpdate(
    { _id: id },
    { $set: { deletedAt: null } },
    { new: true }
  );
  if (!restoredSkillAssessment) throw new NotFoundException("Skill Assessment not found in trash.");
  return restoredSkillAssessment;
};

export const hardRemove = async (id: string) => {
  const skillAssessment = await SkillAssessment.findOneAndDelete({ _id: id });
  return skillAssessment;
};
