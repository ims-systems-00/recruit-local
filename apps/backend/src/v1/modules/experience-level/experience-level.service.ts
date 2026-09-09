import { IListParams, ListQueryParams } from "@rl/types";
import { ExperienceLevelInput, ExperienceLevel } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { experienceLevelProjectQuery } from "./experience-level.query";

type IListExperienceLevelParams = IListParams<ExperienceLevelInput> & { offset?: number };
type IExperienceLevelQueryParams = ListQueryParams<ExperienceLevelInput>;

export const list = async ({ query = {}, options, offset = 0 }: IListExperienceLevelParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await ExperienceLevel.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...experienceLevelProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

/** How many match, ignoring paging. Only the legacy `?page=` branch needs this. */
export const count = ({ query = {} }: IListExperienceLevelParams) =>
  ExperienceLevel.countDocuments({ $and: [sanitizeQueryIds(query), { "deleteMarker.status": { $ne: true } }] });

export const getOne = async ({ query = {} }: IListExperienceLevelParams) => {
  const results = await ExperienceLevel.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...experienceLevelProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Experience level not found.");
  return results[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListExperienceLevelParams) => {
  return ExperienceLevel.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...experienceLevelProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListExperienceLevelParams) => {
  const results = await ExperienceLevel.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...experienceLevelProjectQuery(),
  ]);
  if (results.length === 0) throw new NotFoundException("Experience level not found in trash.");
  return results[0];
};

export const create = async (payload: ExperienceLevelInput) => {
  let experienceLevel = new ExperienceLevel(payload);
  experienceLevel = await experienceLevel.save();
  return experienceLevel;
};

export const update = async ({
  query,
  payload,
}: {
  query: IExperienceLevelQueryParams;
  payload: Partial<ExperienceLevelInput>;
}) => {
  const updated = await ExperienceLevel.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updated) throw new NotFoundException("Experience level not found.");
  return updated;
};

export const softRemove = async ({ query }: { query: IExperienceLevelQueryParams }) => {
  const { deleted } = await ExperienceLevel.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Experience level not found to delete.");
  return getOneSoftDeleted({ query });
};

export const hardRemove = async ({ query }: { query: IExperienceLevelQueryParams }) => {
  const result = await getOneSoftDeleted({ query });
  const deleted = await ExperienceLevel.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Experience level not found to delete.");
  return result;
};

export const restore = async ({ query }: { query: IExperienceLevelQueryParams }) => {
  const { restored } = await ExperienceLevel.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Experience level not found in trash.");
  return getOne({ query });
};
