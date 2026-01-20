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
import { UserAbilityBuilder, EventRegistrationAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { roleScopedSecurityQuery } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import * as statusService from "./status.service";

export const list = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment results.`);
  //   }

  const filter = new MongoQuery(req.query, {
    searchFields: ["label"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();
  //   const securityQuery = roleScopedSecurityQuery(EventRegistrationAuthZEntity, ability);

  const finalQuery = {
    $and: [userSearchQuery /*securityQuery*/],
  };

  const results = await statusService.list({
    query: sanitizeQueryIds(finalQuery) as unknown,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Statuses retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "statuses",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const status = await statusService.getOne(sanitizeQueryIds({ _id: req.params.id }));
  if (!status) {
    throw new NotFoundException(`Status ${req.params.id} not found.`);
  }
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment results.`);
  //   }

  return new ApiResponse({
    message: "Status retrieved.",
    statusCode: StatusCodes.OK,
    data: status,
    fieldName: "status",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Create, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create skill assessment results.`);
  //   }

  const status = await statusService.create(req.body);

  return new ApiResponse({
    message: "Status created.",
    statusCode: StatusCodes.CREATED,
    data: status,
    fieldName: "status",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Update, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update skill assessment results.`);
  //   }

  const status = await statusService.update(sanitizeQueryIds({ _id: req.params.id }), req.body);

  return new ApiResponse({
    message: "Status updated.",
    statusCode: StatusCodes.OK,
    data: status,
    fieldName: "status",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete skill assessment results.`);
  //   }

  await statusService.softRemove(sanitizeQueryIds({ _id: req.params.id }));

  return new ApiResponse({
    message: "Status deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Restore, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore skill assessment results.`);
  //   }

  const status = await statusService.restore(sanitizeQueryIds({ _id: req.params.id }));

  return new ApiResponse({
    message: "Status restored from trash.",
    statusCode: StatusCodes.OK,
    data: status,
    fieldName: "status",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.ForceDelete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to permanently delete skill assessment results.`);
  //   }

  await statusService.hardRemove(sanitizeQueryIds({ _id: req.params.id }));

  return new ApiResponse({
    message: "Status permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};
