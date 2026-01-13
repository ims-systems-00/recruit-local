import { NotFoundException } from "../../../common/helper";
import { matchQuery, excludeDeletedQuery } from "../../../common/query";
import { favouriteProjectQuery } from "./favourite.query";
import { IListParams } from "@inrm/types";
import { IFavouriteInput, Favourite } from "../../../models";

type IListFavouriteParams = IListParams<IFavouriteInput>;

export const list = ({ query = {}, options }: IListFavouriteParams) => {
  return Favourite.aggregatePaginate(
    [...matchQuery(query), ...excludeDeletedQuery(), ...favouriteProjectQuery()],
    options
  );
};

export const getOne = async (query = {}) => {
  const favourite = await Favourite.aggregate([
    ...matchQuery(query),
    ...excludeDeletedQuery(),
    ...favouriteProjectQuery(),
  ]);
  if (favourite.length === 0) throw new NotFoundException("Favourite not found.");
  return favourite[0];
};

export const getSoftDeletedOne = async (query = {}) => {
  const favourite = await Favourite.aggregate([...matchQuery(query), ...favouriteProjectQuery()]);
  if (favourite.length === 0) throw new NotFoundException("Favourite not found in trash.");
  return favourite[0];
};

export const create = async (payload: IFavouriteInput) => {
  let favourite = new Favourite(payload);
  favourite = await favourite.save();
  return favourite;
};

export const update = async (id: string, payload: Partial<IFavouriteInput>) => {
  const updatedFavourite = await Favourite.findOneAndUpdate(
    { _id: id },
    {
      $set: { ...payload },
    },
    { new: true }
  );
  if (!updatedFavourite) throw new NotFoundException("Favourite not found.");
  return updatedFavourite;
};

export const softRemove = async (id: string) => {
  const deletedFavourite = await Favourite.softDelete({ _id: id });
  if (!deletedFavourite) throw new NotFoundException("Favourite not found.");
  return deletedFavourite;
};

export const hardRemove = async (id: string) => {
  const deletedFavourite = await Favourite.findOneAndDelete({ _id: id });

  if (!deletedFavourite) throw new NotFoundException("Favourite not found.");
  return deletedFavourite;
};

export const restore = async (id: string) => {
  const restoredFavourite = await Favourite.restore({ _id: id });
  if (!restoredFavourite) throw new NotFoundException("Favourite not found in trash.");
  return restoredFavourite;
};
