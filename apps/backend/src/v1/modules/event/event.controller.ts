import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as eventService from "./event.service";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  logger,
  NotFoundException,
  pick,
  UnauthorizedException,
} from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@inrm/authz";
import { AbilityAction } from "@inrm/types";
import { roleScopedSecurityQuery } from "./event.query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";

export const list = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, UserAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read users.`);
  //   }

  const filter = new MongoQuery(req.query, {
    searchFields: ["fullName"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();
  //   const securityQuery = roleScopedSecurityQuery(ability);

  //   const finalQuery = {
  //     $and: [userSearchQuery, securityQuery],
  //   };

  const results = await eventService.list({
    query: sanitizeQueryIds(userSearchQuery) as unknown,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Events retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "events",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const event = await eventService.getOne(sanitizeQueryIds({ _id: req.params.id }));
  if (!event) {
    throw new NotFoundException(`Event ${req.params.id} not found.`);
  }
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Read, UserAuthZEntity, user)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read user ${req.params.id}.`);
  //   }

  return new ApiResponse({
    message: `Event ${req.params.id} retrieved`,
    statusCode: StatusCodes.OK,
    data: event,
    fieldName: "event",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Create, UserAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create users.`);
  //   }

  const tenantId = req.session.tenantId!;
  req.body.organizers?.push(tenantId);

  const event = await eventService.create(req.body);

  return new ApiResponse({
    message: "Event created",
    statusCode: StatusCodes.CREATED,
    data: pick(event, [
      "_id",
      "title",
      "type",
      "description",
      "location",
      "capacity",
      "status",
      "mode",
      "organizers",
      "startDate",
      "startTime",
      "endDate",
      "endTime",
      "registrationEndDate",
      "virtualEvent",
      "bannerImageStorage",
      "bannerImageSrc",
      "createdAt",
      "updatedAt",
    ]),
    fieldName: "event",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const event = await eventService.getOne(sanitizeQueryIds({ _id: req.params.id }));

  if (!event) {
    throw new NotFoundException(`Event ${req.params.id} not found.`);
  }

  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Update, UserAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update users.`);
  //   }

  const updatedEvent = await eventService.update(req.params.id, req.body);

  return new ApiResponse({
    message: `Event ${req.params.id} updated.`,
    statusCode: StatusCodes.OK,
    data: updatedEvent,
    fieldName: "event",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const event = await eventService.getOne({
    ...sanitizeQueryIds({ _id: req.params.id }),
  });

  if (!event) {
    throw new NotFoundException(`Event ${req.params.id} not found.`);
  }

  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Delete, UserAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete users.`);
  //   }

  const deletedEvent = await eventService.softRemove(req.params.id);

  return new ApiResponse({
    message: `Event ${req.params.id} deleted.`,
    statusCode: StatusCodes.OK,
    data: deletedEvent,
    fieldName: "event",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Update, UserAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore users.`);
  //   }

  const restoredEvent = await eventService.restore(req.params.id);

  return new ApiResponse({
    message: `Event ${req.params.id} restored.`,
    statusCode: StatusCodes.OK,
    data: restoredEvent,
    fieldName: "event",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const event = await eventService.getOne(sanitizeQueryIds({ _id: req.params.id }));

  if (!event) {
    throw new NotFoundException(`Event ${req.params.id} not found.`);
  }

  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Delete, UserAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to hard delete users.`);
  //   }

  const deletedEvent = await eventService.hardRemove(req.params.id);

  return new ApiResponse({
    message: `Event ${req.params.id} hard deleted.`,
    statusCode: StatusCodes.OK,
    data: deletedEvent,
    fieldName: "event",
  });
};
