import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ValueAbilityBuilder, ValueAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as valueService from "./value.service";

export const list = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Read, ValueAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read values.");
  }

  const filter = new MongoQuery(req.query, { searchFields: ["type", "value"] }).build();
  const query = { ...filter.getFilterQuery(), isActive: true };
  const options = filter.getQueryOptions();

  const results = await valueService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Values retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "values",
    pagination,
  });
};

export const topThree = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Read, ValueAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read values.");
  }

  const filter = new MongoQuery(req.query, { searchFields: ["type", "label"] }).build();
  const query = { ...filter.getFilterQuery(), isActive: true };

  const values = await valueService.topThree({ query });

  return new ApiResponse({
    message: "Top three values retrieved.",
    statusCode: StatusCodes.OK,
    data: values,
    fieldName: "values",
  });
};

export const get = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Read, ValueAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read values.");
  }

  const value = await valueService.getOne({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Value retrieved.",
    statusCode: StatusCodes.OK,
    data: value,
    fieldName: "value",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Create, ValueAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create values.");
  }

  const value = await valueService.create(req.body);

  return new ApiResponse({
    message: "Value created.",
    statusCode: StatusCodes.CREATED,
    data: value,
    fieldName: "value",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Update, new ValueAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to update this value.");
  }

  const value = await valueService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Value updated.",
    statusCode: StatusCodes.OK,
    data: value,
    fieldName: "value",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.SoftDelete, new ValueAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to delete this value.");
  }

  const value = await valueService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Value moved to trash.",
    statusCode: StatusCodes.OK,
    data: value,
    fieldName: "value",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.HardDelete, new ValueAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this value.");
  }

  const value = await valueService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Value permanently deleted.",
    statusCode: StatusCodes.OK,
    data: value,
    fieldName: "value",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Restore, new ValueAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to restore this value.");
  }

  const value = await valueService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Value restored from trash.",
    statusCode: StatusCodes.OK,
    data: value,
    fieldName: "value",
  });
};
