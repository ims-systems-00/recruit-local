import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  logger,
  NotFoundException,
  pick,
  UnauthorizedException,
} from "../../../common/helper";
import { UserAbilityBuilder, EventRegistrationAuthZEntity } from "@inrm/authz";
import { AbilityAction } from "@inrm/types";
import { roleScopedSecurityQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import * as favouriteService from "./favourite.service";

export const list = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read event registrations.`);
  //   }
  const filter = new MongoQuery(req.query, {
    searchFields: ["feedback"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();
  //   const securityQuery = roleScopedSecurityQuery(EventRegistrationAuthZEntity, ability);

  const finalQuery = {
    $and: [userSearchQuery /*securityQuery*/],
  };

  const results = await favouriteService.list({
    query: sanitizeQueryIds(finalQuery) as unknown,
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
  const favourite = await favouriteService.getOne(sanitizeQueryIds({ _id: req.params.id }));
  if (!favourite) {
    throw new NotFoundException(`Favourite ${req.params.id} not found.`);
  }
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read event registrations.`);
  //   }

  return new ApiResponse({
    message: "Favourite retrieved",
    statusCode: StatusCodes.OK,
    data: favourite,
    fieldName: "favourite",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Create, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create event registrations.`);
  //   }

  const userId = req.session.user?._id;
  req.body.userId = userId;

  // todo: check if favourite already exists for the user and item, if also item exists
  const favourite = await favouriteService.create(req.body);
  return new ApiResponse({
    message: "Favourite created",
    statusCode: StatusCodes.CREATED,
    data: favourite,
    fieldName: "favourite",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Update, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update event registrations.`);
  //   }

  const updatedFavourite = await favouriteService.update(req.params.id, req.body);
  if (!updatedFavourite) {
    throw new NotFoundException(`Favourite ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Favourite updated",
    statusCode: StatusCodes.OK,
    data: updatedFavourite,
    fieldName: "favourite",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete event registrations.`);
  //   }

  const deletedFavourite = await favouriteService.softRemove(req.params.id);
  if (!deletedFavourite) {
    throw new NotFoundException(`Favourite ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Favourite deleted",
    statusCode: StatusCodes.OK,
    data: deletedFavourite,
    fieldName: "favourite",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete event registrations.`);
  //   }

  const deletedFavourite = await favouriteService.hardRemove(req.params.id);
  if (!deletedFavourite) {
    throw new NotFoundException(`Favourite ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Favourite permanently deleted",
    statusCode: StatusCodes.OK,
    data: deletedFavourite,
    fieldName: "favourite",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Update, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore event registrations.`);
  //   }

  const restoredFavourite = await favouriteService.restore(req.params.id);
  if (!restoredFavourite) {
    throw new NotFoundException(`Favourite ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Favourite restored",
    statusCode: StatusCodes.OK,
    data: restoredFavourite,
    fieldName: "favourite",
  });
};
