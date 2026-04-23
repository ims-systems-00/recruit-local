/* eslint-disable @typescript-eslint/no-explicit-any */
import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import * as favouriteService from "./favourite.service";
import { modelNames } from "../../../models/constants";
import { sanitizeFavouriteItem } from "./favourite.helper";
import * as jobService from "../job/job.service";
import { AbilityAction } from "@rl/types";
import { ALL_FAVOURITE_FIELDS, FavouriteAbilityBuilder, FavouriteAuthZEntity } from "@rl/authz";
import { favouriteRoleScopedSecurityQuery } from "./favourite.query";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_FAVOURITE_FIELDS,
};

const getSanitizedFavouriteResponse = (doc: any, ability: any) => {
  return sanitizeDocument<FavouriteAuthZEntity>(
    doc,
    ability,
    AbilityAction.Read,
    FavouriteAuthZEntity,
    caslFieldOptions
  );
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, FavouriteAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read favourites.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: [],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), favouriteRoleScopedSecurityQuery(ability)],
  };

  const favoritesResult = await favouriteService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const groupedIds = favoritesResult.docs.reduce<Record<string, string[]>>((acc, fav: any) => {
    if (!acc[fav.itemType]) acc[fav.itemType] = [];
    acc[fav.itemType].push(fav.itemId.toString());
    return acc;
  }, {});

  const fetchPromises: Promise<any[]>[] = [];

  if (groupedIds[modelNames.JOB]?.length) {
    fetchPromises.push(
      jobService
        .list({
          query: { _id: { $in: groupedIds[modelNames.JOB] } } as any,
          options: { limit: groupedIds[modelNames.JOB].length },
        })
        .then((res: any): any[] => {
          if (Array.isArray(res)) return res;
          if (res && Array.isArray(res.docs)) return res.docs;
          return [];
        })
    );
  }

  const fetchedArrays = await Promise.all(fetchPromises);

  const dataMap = new Map<string, any>();
  fetchedArrays.flat().forEach((item: any) => {
    if (item && item._id) {
      dataMap.set(item._id.toString(), item);
    }
  });

  const mergedDocs = favoritesResult.docs.map((fav: any) => {
    const rawItem = dataMap.get(fav.itemId.toString());
    const favObj = typeof fav.toObject === "function" ? fav.toObject() : fav;

    return {
      ...favObj,
      item: sanitizeFavouriteItem(rawItem, favObj.itemType, req.session),
    };
  });

  const sanitizedDocs = sanitizeDocuments<FavouriteAuthZEntity>(
    mergedDocs,
    ability,
    AbilityAction.Read,
    FavouriteAuthZEntity,
    caslFieldOptions
  );

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
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const favourite = await favouriteService.getOne({
    query: { _id: req.params.id },
  });

  if (!favourite || !ability.can(AbilityAction.Read, new FavouriteAuthZEntity(favourite))) {
    throw new UnauthorizedException("You do not have permission to view this favourite.");
  }

  return new ApiResponse({
    message: "Favourite retrieved",
    statusCode: StatusCodes.OK,
    data: getSanitizedFavouriteResponse(favourite, ability),
    fieldName: "favourite",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const filter = new MongoQuery(req.query, {
    searchFields: [],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), favouriteRoleScopedSecurityQuery(ability)],
  };

  const results = await favouriteService.listSoftDeleted({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<FavouriteAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    FavouriteAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Soft deleted favourites retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "favourites",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const favourite = await favouriteService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  if (!favourite || !ability.can(AbilityAction.Read, new FavouriteAuthZEntity(favourite))) {
    throw new UnauthorizedException("You do not have permission to view this deleted favourite.");
  }

  return new ApiResponse({
    message: "Deleted favourite retrieved",
    statusCode: StatusCodes.OK,
    data: getSanitizedFavouriteResponse(favourite, ability),
    fieldName: "favourite",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, FavouriteAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create favourites.");
  }

  const payload = {
    ...req.body,
    userId: req.session.user?._id,
  };

  validateUpdatePayload(payload, ability, AbilityAction.Create, new FavouriteAuthZEntity(payload));

  const favourite = await favouriteService.create({ payload });

  if (!ability.can(AbilityAction.Read, new FavouriteAuthZEntity(favourite))) {
    throw new UnauthorizedException("You do not have permission to view this favourite.");
  }

  return new ApiResponse({
    message: "Favourite created",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedFavouriteResponse(favourite, ability),
    fieldName: "favourite",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingFavourite = await favouriteService.getOne({ query: { _id: req.params.id } });
  if (!existingFavourite) throw new NotFoundException("Favourite not found");

  const authZEntity = new FavouriteAuthZEntity(existingFavourite);

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("User is not authorized to update this favourite.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const updatedFavourite = await favouriteService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Favourite updated",
    statusCode: StatusCodes.OK,
    data: getSanitizedFavouriteResponse(updatedFavourite, ability),
    fieldName: "favourite",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingFavourite = await favouriteService.getOne({ query: { _id: req.params.id } });

  if (!existingFavourite || !ability.can(AbilityAction.SoftDelete, new FavouriteAuthZEntity(existingFavourite))) {
    throw new UnauthorizedException("You do not have permission to delete this favourite.");
  }

  const result = await favouriteService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite moved to trash",
    statusCode: StatusCodes.OK,
    data: getSanitizedFavouriteResponse(result, ability),
    fieldName: "favourite",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingFavourite = await favouriteService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingFavourite || !ability.can(AbilityAction.HardDelete, new FavouriteAuthZEntity(existingFavourite))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this favourite.");
  }

  const result = await favouriteService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite permanently deleted",
    statusCode: StatusCodes.OK,
    data: getSanitizedFavouriteResponse(result, ability),
    fieldName: "favourite",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new FavouriteAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingFavourite = await favouriteService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingFavourite || !ability.can(AbilityAction.Restore, new FavouriteAuthZEntity(existingFavourite))) {
    throw new UnauthorizedException("You do not have permission to restore this favourite.");
  }

  const result = await favouriteService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Favourite restored",
    statusCode: StatusCodes.OK,
    data: getSanitizedFavouriteResponse(result, ability),
    fieldName: "favourite",
  });
};
