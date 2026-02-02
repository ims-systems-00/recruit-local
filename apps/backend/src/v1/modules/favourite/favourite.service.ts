import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { favouriteProjectQuery } from "./favourite.query";
import { IListParams, ListQueryParams } from "@rl/types";
import { IFavouriteInput, Favourite } from "../../../models";

type IListFavouriteParams = IListParams<IFavouriteInput>;
type IFavouriteQueryParams = ListQueryParams<IFavouriteInput>;

export const list = ({ query = {}, options }: IListFavouriteParams) => {
  return Favourite.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...excludeDeletedQuery(), ...favouriteProjectQuery()],
    options
  );
};

export const getOne = async ({ query = {} }: IListFavouriteParams) => {
  const favourites = await Favourite.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...favouriteProjectQuery(),
  ]);
  if (favourites.length === 0) throw new NotFoundException("Favourite not found.");
  return favourites[0];
};

export const listSoftDeleted = async ({ query = {}, options }: IListFavouriteParams) => {
  return Favourite.aggregatePaginate(
    [...matchQuery(sanitizeQueryIds(query)), ...onlyDeletedQuery(), ...favouriteProjectQuery()],
    options
  );
};

export const getOneSoftDeleted = async ({ query = {} }: IListFavouriteParams) => {
  const favourites = await Favourite.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...favouriteProjectQuery(),
  ]);
  if (favourites.length === 0) throw new NotFoundException("Favourite not found in trash.");
  return favourites[0];
};

export const create = async (payload: IFavouriteInput) => {
  let favourite = new Favourite(payload);
  favourite = await favourite.save();
  return favourite;
};

export const update = async ({
  query,
  payload,
}: {
  query: IFavouriteQueryParams;
  payload: Partial<IFavouriteInput>;
}) => {
  const updatedFavourite = await Favourite.findOneAndUpdate(sanitizeQueryIds(query), { $set: payload }, { new: true });
  if (!updatedFavourite) throw new NotFoundException("Favourite not found.");
  return updatedFavourite;
};

export const softRemove = async ({ query }: { query: IFavouriteQueryParams }) => {
  const { deleted } = await Favourite.softDelete(sanitizeQueryIds(query));
  if (!deleted) throw new NotFoundException("Favourite not found to delete.");
  return { deleted };
};

export const hardRemove = async ({ query }: { query: IFavouriteQueryParams }) => {
  const deletedFavourite = await Favourite.findOneAndDelete(sanitizeQueryIds(query));
  if (!deletedFavourite) throw new NotFoundException("Favourite not found to delete.");
  return deletedFavourite;
};

export const restore = async ({ query }: { query: IFavouriteQueryParams }) => {
  const { restored } = await Favourite.restore(sanitizeQueryIds(query));
  if (!restored) throw new NotFoundException("Favourite not found in trash.");
  return { restored };
};
