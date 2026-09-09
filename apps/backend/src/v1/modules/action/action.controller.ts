import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams, NotFoundException, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, CvAbilityBuilder } from "@rl/authz"; // Updated AuthZ Entity
import { AbilityAction } from "@rl/types";
import { runCursorList } from "../../../common/query";
import { sanitizeQueryIds } from "../../../common/helper/sanitizeQueryIds";
import { actionListQuerySpec } from "./action.query";
import * as actionService from "./action.service";

export const list = async ({ req }: ControllerParams) => {
  // const abilityBuilder = new UserAbilityBuilder(req.session);
  // const ability = abilityBuilder.getAbility();

  // if (!ability.can(AbilityAction.Read, ActionAuthZEntity)) {
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read actions.`);
  // }

  const { docs, pagination } = await runCursorList({
    query: req.query,
    // No CASL scoping here — the ability check above is still commented out, so
    // this lists every action. Unchanged by the migration, but worth knowing.
    spec: actionListQuerySpec,
    fetch: ({ query, options, offset }) => actionService.list({ query, options, offset }),
    count: ({ query }) => actionService.count({ query }),
  });

  return new ApiResponse({
    message: "Actions retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "actions",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  // const abilityBuilder = new UserAbilityBuilder(req.session);
  // const ability = abilityBuilder.getAbility();

  // if (!ability.can(AbilityAction.Read, ActionAuthZEntity)) {
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read actions.`);
  // }

  const action = await actionService.getOne({
    query: sanitizeQueryIds({ _id: req.params.id }),
  });

  return new ApiResponse({
    message: "Action retrieved.",
    statusCode: StatusCodes.OK,
    data: action,
    fieldName: "action",
  });
};

export const create = async ({ req }: ControllerParams) => {
  // const abilityBuilder = new UserAbilityBuilder(req.session);
  // const ability = abilityBuilder.getAbility();

  // if (!ability.can(AbilityAction.Create, ActionAuthZEntity)) {
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to create actions.`);
  // }

  const action = await actionService.create({
    payload: req.body,
  });

  return new ApiResponse({
    message: "Action created.",
    statusCode: StatusCodes.CREATED,
    data: action,
    fieldName: "action",
  });
};

export const update = async ({ req }: ControllerParams) => {
  // const abilityBuilder = new UserAbilityBuilder(req.session);
  // const ability = abilityBuilder.getAbility();

  // if (!ability.can(AbilityAction.Update, ActionAuthZEntity)) {
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update actions.`);
  // }

  const action = await actionService.update({
    query: sanitizeQueryIds({ _id: req.params.id }),
    payload: req.body,
  });

  return new ApiResponse({
    message: "Action updated.",
    statusCode: StatusCodes.OK,
    data: action,
    fieldName: "action",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  // const abilityBuilder = new UserAbilityBuilder(req.session);
  // const ability = abilityBuilder.getAbility();

  // if (!ability.can(AbilityAction.Delete, ActionAuthZEntity)) {
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete actions.`);
  // }

  await actionService.softRemove({
    query: sanitizeQueryIds({ _id: req.params.id }),
  });

  return new ApiResponse({
    message: "Action deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  // const abilityBuilder = new UserAbilityBuilder(req.session);
  // const ability = abilityBuilder.getAbility();

  // if (!ability.can(AbilityAction.Restore, ActionAuthZEntity)) {
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore actions.`);
  // }

  const action = await actionService.restore({
    query: sanitizeQueryIds({ _id: req.params.id }),
  });

  return new ApiResponse({
    message: "Action restored from trash.",
    statusCode: StatusCodes.OK,
    data: action,
    fieldName: "action",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  // const abilityBuilder = new UserAbilityBuilder(req.session);
  // const ability = abilityBuilder.getAbility();

  // if (!ability.can(AbilityAction.ForceDelete, ActionAuthZEntity)) {
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to permanently delete actions.`);
  // }

  await actionService.hardRemove({
    query: sanitizeQueryIds({ _id: req.params.id }),
  });

  return new ApiResponse({
    message: "Action permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};
