import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { educationProjectQuery } from "./education.query";
import { Education, EducationInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { IListParams, ListQueryParams } from "@rl/types";

type IListEducationParams = IListParams<EducationInput>;
type IEducationQueryParams = ListQueryParams<EducationInput>;

export const list = ({ query = {}, options }: IListEducationParams) => {
  return Education.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...educationProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListEducationParams) => {
  const educations = await Education.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...educationProjectQuery(),
  ]);
  if (educations.length === 0) throw new NotFoundException("Education Profile not found.");
  return educations[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListEducationParams) => {
  return Education.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...educationProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListEducationParams) => {
  const educations = await Education.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...educationProjectQuery(),
  ]);
  if (educations.length === 0) throw new NotFoundException("Education Profile not found in trash.");
  return educations[0];
};

export const create = async (payload: EducationInput) => {
  let education = new Education(payload);
  education = await education.save();
  return education;
};

export const update = async ({
  query,
  payload,
}: {
  query: IEducationQueryParams;
  payload: Partial<EducationInput>;
}) => {
  const updatedEducation = await Education.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updatedEducation) throw new NotFoundException("Education Profile not found.");
  return updatedEducation;
};

export const softRemove = async ({ query }: { query: IEducationQueryParams }) => {
  const { deleted } = await Education.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Education Profile not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: IEducationQueryParams }) => {
  const deletedEducation = await Education.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedEducation) throw new NotFoundException("Education Profile not found to delete.");
  return deletedEducation;
};

export const restore = async ({ query }: { query: IEducationQueryParams }) => {
  const { restored } = await Education.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Education Profile not found in trash.");
  return { restored };
};
