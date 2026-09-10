import { NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { IListParams, ListQueryParams } from "@rl/types";
import { skillAssessmentProjectionQuery } from "./skill-assessment.query";
import { ISkillAssessmentInput, SkillAssessment } from "../../../models";

type IListSkillAssessmentParams = IListParams<ISkillAssessmentInput> & { offset?: number };
type ISkillAssessmentQueryParams = ListQueryParams<ISkillAssessmentInput>;

export const list = async ({ query = {}, options, offset = 0 }: IListSkillAssessmentParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const aggregate = SkillAssessment.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...skillAssessmentProjectionQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(await aggregate, limit);
};

/** How many match, ignoring paging. Only the legacy `?page=` branch needs this. */
export const count = ({ query = {} }: IListSkillAssessmentParams) =>
  SkillAssessment.countDocuments({ $and: [sanitizeQueryIds(query), { "deleteMarker.status": { $ne: true } }] });

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
