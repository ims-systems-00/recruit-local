import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { educationProjectQuery } from "./education.query";
import { Education, EducationInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { enqueueProfileCompletion } from "../../../queue/profileCompletionUpdateQueue";
import { IListParams, ListQueryParams } from "@rl/types";

type IListEducationParams = IListParams<EducationInput> & { offset?: number };
type IEducationQueryParams = ListQueryParams<EducationInput>;

export const list = async ({ query = {}, options, offset = 0 }: IListEducationParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Education.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...educationProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

/** How many match, ignoring paging. Only the legacy `?page=` branch needs this. */
export const count = ({ query = {} }: IListEducationParams) =>
  Education.countDocuments({ $and: [sanitizeQueryIds(query), { "deleteMarker.status": { $ne: true } }] });

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
  await enqueueProfileCompletion(education.userId);
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
  await enqueueProfileCompletion(updatedEducation.userId);
  return updatedEducation;
};

export const softRemove = async ({ query }: { query: IEducationQueryParams }) => {
  const { deleted } = await Education.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Education Profile not found to delete.");
  const result = await getOneSoftDeleted({ query });
  await enqueueProfileCompletion(result?.userId);
  return result;
};

export const hardRemove = async ({ query }: { query: IEducationQueryParams }) => {
  const result = await getOneSoftDeleted({ query });
  const deletedEducation = await Education.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedEducation) throw new NotFoundException("Education Profile not found to delete.");
  await enqueueProfileCompletion(result?.userId);
  return result;
};

export const restore = async ({ query }: { query: IEducationQueryParams }) => {
  const { restored } = await Education.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Education Profile not found in trash.");
  const result = await getOne({ query });
  await enqueueProfileCompletion(result?.userId);
  return result;
};
