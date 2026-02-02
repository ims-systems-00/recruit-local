import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as favouriteService from "./favourite.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: [],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await favouriteService.list({
    query,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Favourites retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "favourites",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const favourite = await favouriteService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite retrieved",
    statusCode: StatusCodes.OK,
    data: favourite,
    fieldName: "favourite",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["feedback"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await favouriteService.listSoftDeleted({
    query,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted favourites retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "favourites",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const favourite = await favouriteService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted favourite retrieved",
    statusCode: StatusCodes.OK,
    data: favourite,
    fieldName: "favourite",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;
  req.body.userId = userId;

  // TODO: Add check if favourite already exists for the user/item here or in service
  const favourite = await favouriteService.create(req.body);

  return new ApiResponse({
    message: "Favourite created",
    statusCode: StatusCodes.CREATED,
    data: favourite,
    fieldName: "favourite",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const updatedFavourite = await favouriteService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Favourite updated",
    statusCode: StatusCodes.OK,
    data: updatedFavourite,
    fieldName: "favourite",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await favouriteService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite moved to trash",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await favouriteService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite permanently deleted",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const restoredFavourite = await favouriteService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite restored",
    statusCode: StatusCodes.OK,
    data: restoredFavourite,
    fieldName: "favourite",
  });
};
