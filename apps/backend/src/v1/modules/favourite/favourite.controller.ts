/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as favouriteService from "./favourite.service";
import { modelNames } from "../../../models/constants";
import { sanitizeFavouriteItem } from "./favourite.helper";
import * as jobService from "../job/job.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: [],
  }).build();

  const query = {
    ...filter.getFilterQuery(),
    userId: req.session.user._id,
  };

  const options = filter.getQueryOptions();

  // 1. Fetch favorites with standard options
  const favoritesResult = await favouriteService.list({
    query,
    options,
  });

  // 2. Group the itemIds by itemType
  const groupedIds = favoritesResult.docs.reduce<Record<string, string[]>>((acc, fav: any) => {
    if (!acc[fav.itemType]) acc[fav.itemType] = [];
    acc[fav.itemType].push(fav.itemId.toString());
    return acc;
  }, {});

  // 3. Fetch the actual raw documents
  const fetchPromises = [];

  if (groupedIds[modelNames.JOB]?.length) {
    fetchPromises.push(
      jobService
        .list({
          // FIX 1: Pass the array directly. Your custom wrapper handles the $in logic!
          query: { _id: groupedIds[modelNames.JOB] },
          // FIX 2: Instead of pagination: false, we just set the limit to exactly
          // the number of items we are asking for.
          options: { limit: groupedIds[modelNames.JOB].length },
        })
        .then((res) => res.docs || res)
    );
  }

  // Resolve all fetches
  const fetchedArrays = await Promise.all(fetchPromises);

  // Flatten into a Map for instant O(1) lookups
  const dataMap = new Map();
  fetchedArrays.flat().forEach((item: any) => {
    if (item && item._id) {
      dataMap.set(item._id.toString(), item);
    }
  });

  // 4. Stitch the data together and apply CASL sanitization
  const sanitizedDocs = favoritesResult.docs.map((fav: any) => {
    const rawItem = dataMap.get(fav.itemId.toString());

    // FIX 3: Manually convert the Mongoose document to a plain JS object
    // to safely use the spread operator, since we couldn't use `lean: true`.
    const favObj = typeof fav.toObject === "function" ? fav.toObject() : fav;

    return {
      ...favObj,
      item: sanitizeFavouriteItem(rawItem, favObj.itemType, req.session),
    };
  });

  // 5. Format and Return
  const { data, pagination } = formatListResponse({ ...favoritesResult, docs: sanitizedDocs });

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
  const result = await favouriteService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite moved to trash",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "favourite",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const result = await favouriteService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite permanently deleted",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "favourite",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const result = await favouriteService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite restored",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "favourite",
  });
};
