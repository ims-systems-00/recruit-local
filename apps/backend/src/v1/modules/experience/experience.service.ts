import { IListParams, ListQueryParams } from "@rl/types";
import { ExperienceInput, Experience } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
// Assuming this query file exists following your pattern
import { experienceProjectionQuery } from "./experience.query";

type IListExperienceParams = IListParams<ExperienceInput>;
type IExperienceQueryParams = ListQueryParams<ExperienceInput>;

export const list = ({ query = {}, options }: IListExperienceParams) => {
  return Experience.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...experienceProjectionQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListExperienceParams) => {
  const experiences = await Experience.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...experienceProjectionQuery(),
  ]);
  if (experiences.length === 0) throw new NotFoundException("Experience not found.");
  return experiences[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListExperienceParams) => {
  return Experience.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...experienceProjectionQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListExperienceParams) => {
  const experiences = await Experience.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...experienceProjectionQuery(),
  ]);
  if (experiences.length === 0) throw new NotFoundException("Experience not found in trash.");
  return experiences[0];
};

export const create = async (payload: ExperienceInput) => {
  let experience = new Experience(payload);
  experience = await experience.save();
  return experience;
};

export const update = async ({
  query,
  payload,
}: {
  query: IExperienceQueryParams;
  payload: Partial<ExperienceInput>;
}) => {
  const updatedExperience = await Experience.findOneAndUpdate(
    sanitizeQueryIds(query),
    { $set: payload },
    { new: true }
  );
  if (!updatedExperience) throw new NotFoundException("Experience not found.");
  return updatedExperience;
};

export const softRemove = async ({ query }: { query: IExperienceQueryParams }) => {
  const { deleted } = await Experience.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Experience not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: IExperienceQueryParams }) => {
  const deletedExperience = await Experience.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedExperience) throw new NotFoundException("Experience not found to delete.");
  return deletedExperience;
};

export const restore = async ({ query }: { query: IExperienceQueryParams }) => {
  const { restored } = await Experience.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Experience not found in trash.");
  return { restored };
};
