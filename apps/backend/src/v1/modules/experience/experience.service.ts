import { IListParams } from "@inrm/types";
import { ExperienceInput, Experience } from "../../../models";
import { NotFoundException } from "../../../common/helper";

type IListExperienceParams = IListParams<ExperienceInput>;

export const list = ({ query = {}, options }: IListExperienceParams) => {
  return Experience.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const experience = await Experience.findOneWithExcludeDeleted({ _id: id });
  if (!experience) throw new NotFoundException("Experience not found.");
  return experience;
};

export const create = async (payload: ExperienceInput) => {
  let experience = new Experience(payload);
  experience = await experience.save();

  return experience;
};

export const update = async (id: string, payload: Partial<ExperienceInput>) => {
  const updatedExperience = await Experience.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedExperience) throw new NotFoundException("Experience not found.");
  return updatedExperience;
};

export const softRemove = async (id: string) => {
  const experience = await getOne(id);
  const { deleted } = await Experience.softDelete({ _id: id });

  return { experience, deleted };
};

export const hardRemove = async (id: string) => {
  const experience = await getOne(id);
  await Experience.findOneAndDelete({ _id: id });

  return experience;
};

export const restore = async (id: string) => {
  const { restored } = await Experience.restore({ _id: id });
  if (!restored) throw new NotFoundException("Experience not found in trash.");

  const experience = await getOne(id);

  return { experience, restored };
};
