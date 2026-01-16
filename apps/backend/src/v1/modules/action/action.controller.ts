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
import * as actionService from "./action.service";

export const list = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment results.`);
  //   }

  const filter = new MongoQuery(req.query, {
    searchFields: ["label"],
  }).build();

  const actionSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();
  //   const securityQuery = roleScopedSecurityQuery(EventRegistrationAuthZEntity, ability);

  const finalQuery = {
    $and: [actionSearchQuery /*securityQuery*/],
  };

  const results = await actionService.list({
    query: sanitizeQueryIds(finalQuery) as unknown,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Actions retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "actions",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const action = await actionService.getOne(sanitizeQueryIds({ _id: req.params.id }));
  if (!action) {
    throw new NotFoundException(`Action  ${req.params.id} not found.`);
  }
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment results.`);
  //   }

  return new ApiResponse({
    message: "Action retrieved.",
    statusCode: StatusCodes.OK,
    data: action,
    fieldName: "action",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Create, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create skill assessment results.`);
  //   }

  const action = await actionService.create(req.body);

  return new ApiResponse({
    message: "Action created.",
    statusCode: StatusCodes.CREATED,
    data: action,
    fieldName: "action",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Update, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update skill assessment results.`);
  //   }

  const action = await actionService.update(sanitizeQueryIds({ _id: req.params.id }), req.body);

  return new ApiResponse({
    message: "Action updated.",
    statusCode: StatusCodes.OK,
    data: action,
    fieldName: "action",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Delete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete skill assessment results.`);
  //   }

  await actionService.softRemove(sanitizeQueryIds({ _id: req.params.id }));

  return new ApiResponse({
    message: "Action deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.Restore, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore skill assessment results.`);
  //   }

  const action = await actionService.restore(sanitizeQueryIds({ _id: req.params.id }));

  return new ApiResponse({
    message: "Action restored from trash.",
    statusCode: StatusCodes.OK,
    data: action,
    fieldName: "action",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();

  //   if (!ability.can(AbilityAction.ForceDelete, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to permanently delete skill assessment results.`);
  //   }

  await actionService.hardRemove(sanitizeQueryIds({ _id: req.params.id }));

  return new ApiResponse({
    message: "Action permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};
