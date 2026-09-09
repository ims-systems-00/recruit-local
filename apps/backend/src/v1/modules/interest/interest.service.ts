import { IListParams, ListQueryParams } from "@rl/types";
import { InterestInput, Interest } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import {
  matchQuery,
  excludeDeletedQuery,
  onlyDeletedQuery,
  cursorPageStages,
  toCursorPage,
} from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { interestProjectQuery } from "./interest.query";

type IListInterestParams = IListParams<InterestInput> & { offset?: number };
type IInterestQueryParams = ListQueryParams<InterestInput>;

export const list = async ({ query = {}, options, offset = 0 }: IListInterestParams) => {
  const limit = options?.limit && options.limit > 0 ? options.limit : 10;

  const docs = await Interest.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...interestProjectQuery(),
    ...cursorPageStages(options?.sort ? String(options.sort) : undefined, offset, limit),
  ]);

  return toCursorPage(docs, limit);
};

/** How many match, ignoring paging. Only the legacy `?page=` branch needs this. */
export const count = ({ query = {} }: IListInterestParams) =>
  Interest.countDocuments({ $and: [sanitizeQueryIds(query), { "deleteMarker.status": { $ne: true } }] });

export const getOne = async ({ query = {} }: IListInterestParams) => {
  const interests = await Interest.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...interestProjectQuery(),
  ]);
  if (interests.length === 0) throw new NotFoundException("Interest not found.");
  return interests[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListInterestParams) => {
  return Interest.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...interestProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListInterestParams) => {
  const interests = await Interest.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...interestProjectQuery(),
  ]);
  if (interests.length === 0) throw new NotFoundException("Interest not found in trash.");
  return interests[0];
};

export const create = async (payload: InterestInput) => {
  let interest = new Interest(payload);
  interest = await interest.save();
  return interest;
};

export const update = async ({ query, payload }: { query: IInterestQueryParams; payload: Partial<InterestInput> }) => {
  const updatedInterest = await Interest.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updatedInterest) throw new NotFoundException("Interest not found.");
  return updatedInterest;
};

export const softRemove = async ({ query }: { query: IInterestQueryParams }) => {
  const { deleted } = await Interest.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Interest not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: IInterestQueryParams }) => {
  const deletedInterest = await Interest.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedInterest) throw new NotFoundException("Interest not found to delete.");
  return deletedInterest;
};

export const restore = async ({ query }: { query: IInterestQueryParams }) => {
  const { restored } = await Interest.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Interest not found in trash.");
  return { restored };
};
