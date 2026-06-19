import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { WorkModeAbilityBuilder, WorkModeAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as workModeService from "./work-mode.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const query = { ...filter.getFilterQuery(), isActive: true };
  const options = filter.getQueryOptions();

  const results = await workModeService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Work modes retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "workModes",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const workMode = await workModeService.getOne({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Work mode retrieved.",
    statusCode: StatusCodes.OK,
    data: workMode,
    fieldName: "workMode",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const ability = new WorkModeAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Create, WorkModeAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create work modes.");
  }

  const workMode = await workModeService.create(req.body);

  return new ApiResponse({
    message: "Work mode created.",
    statusCode: StatusCodes.CREATED,
    data: workMode,
    fieldName: "workMode",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new WorkModeAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Update, new WorkModeAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to update this work mode.");
  }

  const workMode = await workModeService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Work mode updated.",
    statusCode: StatusCodes.OK,
    data: workMode,
    fieldName: "workMode",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new WorkModeAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.SoftDelete, new WorkModeAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to delete this work mode.");
  }

  const workMode = await workModeService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Work mode moved to trash.",
    statusCode: StatusCodes.OK,
    data: workMode,
    fieldName: "workMode",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new WorkModeAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.HardDelete, new WorkModeAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this work mode.");
  }

  const workMode = await workModeService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Work mode permanently deleted.",
    statusCode: StatusCodes.OK,
    data: workMode,
    fieldName: "workMode",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new WorkModeAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Restore, new WorkModeAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to restore this work mode.");
  }

  const workMode = await workModeService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Work mode restored from trash.",
    statusCode: StatusCodes.OK,
    data: workMode,
    fieldName: "workMode",
  });
};
