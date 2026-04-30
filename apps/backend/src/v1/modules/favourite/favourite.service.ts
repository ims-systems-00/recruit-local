import { BadRequestException, NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery, onlyDeletedQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { favouriteProjectQuery } from "./favourite.query";
import { Favourite } from "../../../models";
import {
  IFavouriteCreateParams,
  IFavouriteGetParams,
  IFavouriteUpdateParams,
  IListFavouriteParams,
} from "./favourite.interface";

export const list = ({ query = {}, options, session }: IListFavouriteParams) => {
  const aggregate = Favourite.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...favouriteProjectQuery(),
  ]);

  if (session) aggregate.session(session);

  return Favourite.aggregatePaginate(aggregate, options);
};

export const getOne = async ({ query = {}, session }: IFavouriteGetParams) => {
  const aggregate = Favourite.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...excludeDeletedQuery(),
    ...favouriteProjectQuery(),
  ]);

  if (session) aggregate.session(session);

  const favourites = await aggregate;

  if (favourites.length === 0) throw new NotFoundException("Favourite not found.");
  return favourites[0];
};

export const listSoftDeleted = async ({ query = {}, options, session }: IListFavouriteParams) => {
  const aggregate = Favourite.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...favouriteProjectQuery(),
  ]);

  if (session) aggregate.session(session);

  return Favourite.aggregatePaginate(aggregate, options);
};

export const getOneSoftDeleted = async ({ query = {}, session }: IFavouriteGetParams) => {
  const aggregate = Favourite.aggregate([
    ...matchQuery(sanitizeQueryIds(query)),
    ...onlyDeletedQuery(),
    ...favouriteProjectQuery(),
  ]);

  if (session) aggregate.session(session);

  const favourites = await aggregate;

  if (favourites.length === 0) throw new NotFoundException("Favourite not found in trash.");
  return favourites[0];
};

export const create = async ({ payload, session }: IFavouriteCreateParams) => {
  const existingFavourite = await Favourite.findOne({
    userId: payload.userId,
    itemId: payload.itemId,
    itemType: payload.itemType,
    "deleteMarker.status": false,
  }).session(session || null);

  if (existingFavourite) {
    throw new BadRequestException("Item is already in favourites.");
  }

  const favourite = await new Favourite(payload).save({ session });

  return getOne({
    query: { _id: favourite._id.toString() },
    session,
  });
};

export const update = async ({ query, payload, session }: IFavouriteUpdateParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const favourite = await getOne({ query: sanitizedQuery, session });

  const updatedFavourite = await Favourite.findOneAndUpdate(
    { _id: favourite._id },
    { $set: payload },
    { new: true, session }
  );

  if (!updatedFavourite) throw new NotFoundException("Favourite not found.");

  return getOne({
    query: { _id: updatedFavourite._id.toString() },
    session,
  });
};

export const softDelete = async ({ query, session }: IFavouriteGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const favouriteToSoftDelete = await getOne({ query: sanitizedQuery, session });

  const { deleted } = await Favourite.softDelete({ _id: favouriteToSoftDelete._id }, { session });
  if (!deleted) throw new NotFoundException("Favourite not found to delete.");

  return getOneSoftDeleted({ query: sanitizedQuery, session });
};

export const hardDelete = async ({ query, session }: IFavouriteGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const favourite = await getOneSoftDeleted({ query: sanitizedQuery, session });

  const deletedFavourite = await Favourite.findOneAndDelete({ _id: favourite._id }, { session });
  if (!deletedFavourite) throw new NotFoundException("Favourite not found to delete.");

  return favourite;
};

export const restore = async ({ query, session }: IFavouriteGetParams) => {
  const sanitizedQuery = sanitizeQueryIds(query);
  const { restored } = await Favourite.restore(sanitizedQuery, { session });
  if (!restored) throw new NotFoundException("Favourite not found in trash.");

  return getOne({ query: sanitizedQuery, session });
};
