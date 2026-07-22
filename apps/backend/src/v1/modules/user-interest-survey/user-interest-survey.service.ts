import { Types } from "mongoose";
import { IListParams, ListQueryParams } from "@rl/types";
import { IUserInterestSurveyInput, UserInterestSurvey } from "../../../models/user-interest-survey.model";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { userInterestSurveyProjectQuery } from "./user-interest-survey.query";

type IListSurveyParams = IListParams<IUserInterestSurveyInput>;
type ISurveyQueryParams = ListQueryParams<IUserInterestSurveyInput>;

export const list = ({ query = {}, options }: IListSurveyParams) => {
  return UserInterestSurvey.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...userInterestSurveyProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListSurveyParams) => {
  const surveys = await UserInterestSurvey.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...userInterestSurveyProjectQuery(),
  ]);
  if (surveys.length === 0) throw new NotFoundException("User interest survey not found.");
  return surveys[0];
};

export const getOneSoftDeleted = async ({ query = {} }: IListSurveyParams) => {
  const surveys = await UserInterestSurvey.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...userInterestSurveyProjectQuery(),
  ]);
  if (surveys.length === 0) throw new NotFoundException("User interest survey not found in trash.");
  return surveys[0];
};

export const upsert = async ({
  userId,
  payload,
}: {
  userId: Types.ObjectId;
  payload: Partial<IUserInterestSurveyInput>;
}) => {
  const survey = await UserInterestSurvey.findOneAndUpdate(
    { userId },
    { $set: { ...payload, userId } },
    { new: true, upsert: true }
  );
  return survey;
};

export const update = async ({
  query,
  payload,
}: {
  query: ISurveyQueryParams;
  payload: Partial<IUserInterestSurveyInput>;
}) => {
  const updated = await UserInterestSurvey.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updated) throw new NotFoundException("User interest survey not found.");
  return updated;
};

export const softDelete = async ({ query }: { query: ISurveyQueryParams }) => {
  const { deleted } = await UserInterestSurvey.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("User interest survey not found to delete.");
  return { deleted };
};

export const hardDelete = async ({ query }: { query: ISurveyQueryParams }) => {
  const deleted = await UserInterestSurvey.findOneAndDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("User interest survey not found to delete.");
  return deleted;
};

export const restore = async ({ query }: { query: ISurveyQueryParams }) => {
  const { restored } = await UserInterestSurvey.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("User interest survey not found in trash.");
  return { restored };
};
