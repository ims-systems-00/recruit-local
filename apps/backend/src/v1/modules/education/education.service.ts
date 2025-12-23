import { IListEducationProfileParams } from "./education.interface";
import { Education, EducationInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";

export const list = ({ query = {}, options }: IListEducationProfileParams) => {
  return Education.paginateAndExcludeDeleted(query, { ...options, sort: { createdAt: -1 } });
};

export const getOne = async (id: string) => {
  const education = await Education.findOneWithExcludeDeleted({ _id: id });
  if (!education) throw new NotFoundException("Education Profile not found.");
  return education;
};

export const create = async (payload: EducationInput) => {
  let education = new Education(payload);
  education = await education.save();

  return education;
};

export const update = async (id: string, payload: Partial<EducationInput>) => {
  const updatedEducation = await Education.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );

  if (!updatedEducation) throw new NotFoundException("Education Profile not found.");
  return updatedEducation;
};

export const softRemove = async (id: string) => {
  const education = await getOne(id);
  const { deleted } = await Education.softDelete({ _id: id });

  return { education, deleted };
};

export const hardRemove = async (id: string) => {
  const education = await getOne(id);
  await Education.findOneAndDelete({ _id: id });

  return education;
};

export const restore = async (id: string) => {
  const { restored } = await Education.restore({ _id: id });
  if (!restored) throw new NotFoundException("Education Profile not found in trash.");

  const education = await getOne(id);

  return { education, restored };
};
