import { IListParams, ListQueryParams } from "@rl/types";
import { SkillInput, Skill } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
// Assuming this query file exists following your pattern
import { skillProjectQuery } from "./skill.query";

type IListSkillParams = IListParams<SkillInput>;
type ISkillQueryParams = ListQueryParams<SkillInput>;

export const list = ({ query = {}, options }: IListSkillParams) => {
  return Skill.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...skillProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListSkillParams) => {
  const skills = await Skill.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...skillProjectQuery(),
  ]);
  if (skills.length === 0) throw new NotFoundException("Skill not found.");
  return skills[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListSkillParams) => {
  return Skill.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...skillProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListSkillParams) => {
  const skills = await Skill.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...skillProjectQuery(),
  ]);
  if (skills.length === 0) throw new NotFoundException("Skill not found in trash.");
  return skills[0];
};

export const create = async (payload: SkillInput) => {
  let skill = new Skill(payload);
  skill = await skill.save();
  return skill;
};

export const update = async ({ query, payload }: { query: ISkillQueryParams; payload: Partial<SkillInput> }) => {
  const updatedSkill = await Skill.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updatedSkill) throw new NotFoundException("Skill not found.");
  return updatedSkill;
};

export const softRemove = async ({ query }: { query: ISkillQueryParams }) => {
  const { deleted } = await Skill.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Skill not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: ISkillQueryParams }) => {
  const deletedSkill = await Skill.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedSkill) throw new NotFoundException("Skill not found to delete.");
  return deletedSkill;
};

export const restore = async ({ query }: { query: ISkillQueryParams }) => {
  const { restored } = await Skill.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Skill not found in trash.");
  return { restored };
};
