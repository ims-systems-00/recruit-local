import { IListParams, ListQueryParams } from "@rl/types";
import { Reaction, IReactionInput } from "../../../models";
import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery, populateStatusQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { reactionProjectQuery } from "./reaction.query";

type IListReactionParams = IListParams<IReactionInput>;
type IReactionQueryParams = ListQueryParams<IReactionInput>;

export const list = ({ query = {}, options }: IListReactionParams) => {
  return Reaction.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...excludeDeletedQuery(),
      ...populateStatusQuery(),
      ...reactionProjectQuery(),
    ],
    options
  );
};

export const getOne = async ({ query = {} }: IListReactionParams) => {
  const reactions = await Reaction.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...populateStatusQuery(),
    ...reactionProjectQuery(),
  ]);
  if (reactions.length === 0) throw new NotFoundException("Reaction not found.");
  return reactions[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListReactionParams) => {
  return Reaction.aggregatePaginate(
    [
      ...matchQuery(sanitizeQueryIds(query)),
      ...onlyDeletedQuery(),
      ...populateStatusQuery(),
      ...reactionProjectQuery(),
    ],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListReactionParams) => {
  const reactions = await Reaction.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...populateStatusQuery(),
    ...reactionProjectQuery(),
  ]);
  if (reactions.length === 0) throw new NotFoundException("Reaction not found in trash.");
  return reactions[0];
};

export const create = async (payload: IReactionInput) => {
  return Reaction.create(payload);
};

export const update = async ({
  query = {},
  update,
}: {
  query: IReactionQueryParams;
  update: Partial<IReactionInput>;
}) => {
  const reaction = await Reaction.findOneAndUpdate(sanitizeQueryIds(query), update, { new: true });
  if (!reaction) throw new NotFoundException("Reaction not found.");
  return reaction;
};

export const softRemove = async (query: IReactionQueryParams) => {
  const reaction = await Reaction.findOneAndUpdate(sanitizeQueryIds(query), { deletedAt: new Date() }, { new: true });
  if (!reaction) throw new NotFoundException("Reaction not found.");
  return reaction;
};

export const restore = async (query: IReactionQueryParams) => {
  const reaction = await Reaction.findOneAndUpdate(sanitizeQueryIds(query), { deletedAt: null }, { new: true });
  if (!reaction) throw new NotFoundException("Reaction not found in trash.");
  return reaction;
};

export const hardRemove = async (query: IReactionQueryParams) => {
  const reaction = await Reaction.findOneAndDelete(sanitizeQueryIds(query));
  if (!reaction) throw new NotFoundException("Reaction not found.");
  return reaction;
};
