import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { IListParams, ListQueryParams } from "@rl/types";
import { skillAssessmentProjectionQuery } from "./skill-assessment.query";
import { ISkillAssessmentInput, SkillAssessment } from "../../../models";

type IListSkillAssessmentParams = IListParams<ISkillAssessmentInput>;
type ISkillAssessmentQueryParams = ListQueryParams<ISkillAssessmentInput>;

export const list = ({ query = {}, options }: IListSkillAssessmentParams) => {
  return SkillAssessment.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...skillAssessmentProjectionQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: ISkillAssessmentQueryParams) => {
  const skillAssessments = await SkillAssessment.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...skillAssessmentProjectionQuery(),
  ]);
  if (skillAssessments.length === 0) throw new NotFoundException("Skill Assessment not found.");
  return skillAssessments[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListSkillAssessmentParams) => {
  return SkillAssessment.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...skillAssessmentProjectionQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListSkillAssessmentParams) => {
  const skillAssessments = await SkillAssessment.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...skillAssessmentProjectionQuery(),
  ]);
  if (skillAssessments.length === 0) throw new NotFoundException("Skill Assessment not found in trash.");
  return skillAssessments[0];
};

export const create = async (payload: ISkillAssessmentInput) => {
  let skillAssessment = new SkillAssessment(payload);
  skillAssessment = await skillAssessment.save();
  return skillAssessment;
};

export const update = async ({
  query,
  payload,
}: {
  query: ISkillAssessmentQueryParams;
  payload: Partial<ISkillAssessmentInput>;
}) => {
  const updatedSkillAssessment = await SkillAssessment.findOneAndUpdate(
    sanitizeQueryIds(query),
    { $set: payload },
    { new: true }
  );
  if (!updatedSkillAssessment) throw new NotFoundException("Skill Assessment not found.");
  return updatedSkillAssessment;
};

export const softRemove = async ({ query }: { query: ISkillAssessmentQueryParams }) => {
  const { deleted } = await SkillAssessment.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Skill Assessment not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: ISkillAssessmentQueryParams }) => {
  const deletedSkillAssessment = await SkillAssessment.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedSkillAssessment) throw new NotFoundException("Skill Assessment not found to delete.");
  return deletedSkillAssessment;
};

export const restore = async ({ query }: { query: ISkillAssessmentQueryParams }) => {
  const { restored } = await SkillAssessment.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Skill Assessment not found in trash.");
  return { restored };
};
