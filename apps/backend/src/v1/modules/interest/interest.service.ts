import { IListParams, ListQueryParams } from "@rl/types";
import { InterestInput, Interest } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { interestProjectQuery } from "./interest.query";

type IListInterestParams = IListParams<InterestInput>;
type IInterestQueryParams = ListQueryParams<InterestInput>;

export const list = ({ query = {}, options }: IListInterestParams) => {
  return Interest.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...interestProjectQuery()],
    options
  );
};

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
