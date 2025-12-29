import { IListParams } from "@inrm/types";
import { SkillInput, Skill } from "../../../models";
import { NotFoundException } from "../../../common/helper";

type IListSkillParams = IListParams<SkillInput>;

export const list = ({ query = {}, options }: IListSkillParams) => {
  return Skill.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const skill = await Skill.findOneWithExcludeDeleted({ _id: id });
  if (!skill) throw new NotFoundException("Skill not found.");
  return skill;
};

export const create = async (payload: SkillInput) => {
  let skill = new Skill(payload);
  skill = await skill.save();

  return skill;
};

export const update = async (id: string, payload: Partial<SkillInput>) => {
  const updatedSkill = await Skill.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedSkill) throw new NotFoundException("Skill not found.");
  return updatedSkill;
};

export const softRemove = async (id: string) => {
  const skill = await getOne(id);
  const { deleted } = await Skill.softDelete({ _id: id });

  return { skill, deleted };
};

export const hardRemove = async (id: string) => {
  const skill = await getOne(id);
  await Skill.findOneAndDelete({ _id: id });

  return skill;
};

export const restore = async (id: string) => {
  const { restored } = await Skill.restore({ _id: id });
  if (!restored) throw new NotFoundException("Skill not found in trash.");

  const skill = await getOne(id);

  return { skill, restored };
};
