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
import * as eventService from "./event-registration.service";
import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";

export const list = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read event registrations.`);
  //   }

  const filter = new MongoQuery(req.query, {
    searchFields: ["eventName", "registrantName"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();
  //   const securityQuery = roleScopedSecurityQuery(EventRegistrationAuthZEntity, ability);

  const finalQuery = {
    $and: [userSearchQuery /*securityQuery*/],
  };

  const results = await eventService.list({
    query: sanitizeQueryIds(finalQuery) as unknown,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Event registrations retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "eventRegistrations",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const eventRegistration = await eventService.getOne(sanitizeQueryIds({ _id: req.params.id }));
  if (!eventRegistration) {
    throw new NotFoundException(`Event registration ${req.params.id} not found.`);
  }
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read event registrations.`);
  //   }

  return new ApiResponse({
    message: "Event registration retrieved",
    statusCode: StatusCodes.OK,
    data: eventRegistration,
    fieldName: "eventRegistration",
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
  const createdEventRegistration = await eventService.create(req.body);

  return new ApiResponse({
    message: "Event registration created",
    statusCode: StatusCodes.CREATED,
    data: createdEventRegistration,
    fieldName: "eventRegistration",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Update, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update event registrations.`);
  //   }

  const updatedEventRegistration = await eventService.update(req.params.id, req.body);

  return new ApiResponse({
    message: "Event registration updated",
    statusCode: StatusCodes.OK,
    data: updatedEventRegistration,
    fieldName: "eventRegistration",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete event registrations.`);
  //   }

  const deletedEventRegistration = await eventService.softRemove(req.params.id);

  return new ApiResponse({
    message: "Event registration deleted",
    statusCode: StatusCodes.OK,
    data: deletedEventRegistration,
    fieldName: "eventRegistration",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to hard delete event registrations.`);
  //   }

  const deletedEventRegistration = await eventService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "Event registration permanently deleted",
    statusCode: StatusCodes.OK,
    data: deletedEventRegistration,
    fieldName: "eventRegistration",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Update, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore event registrations.`);
  //   }

  const restoredEventRegistration = await eventService.restore(req.params.id);

  return new ApiResponse({
    message: "Event registration restored",
    statusCode: StatusCodes.OK,
    data: restoredEventRegistration,
    fieldName: "eventRegistration",
  });
};
