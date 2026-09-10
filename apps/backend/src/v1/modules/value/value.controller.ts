import { StatusCodes } from "http-status-codes";
import { ValueAbilityBuilder, ValueAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, UnauthorizedException } from "../../../common/helper";
import { buildListQuery, runCursorList } from "../../../common/query";
import { valueListQuerySpec } from "./value.query";
import * as valueService from "./value.service";

export const list = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Read, ValueAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read values.");
  }

  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: valueListQuerySpec,
    // Catalog list: gated by the ability check above, then narrowed to active rows.
    extraConditions: [{ isActive: true }],
    fetch: ({ query, options, offset }) => valueService.list({ query, options, offset }),
    count: ({ query }) => valueService.count({ query }),
  });

  return new ApiResponse({
    message: "Values retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "values",
    pagination,
  });
};

export const topThree = async ({ req }: ControllerParams) => {
  const ability = new ValueAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Read, ValueAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read values.");
  }

  // Not a list endpoint — it returns the three heaviest values, no paging. The
  // only query input it ever honoured was `type`.
  const { filter } = buildListQuery(req.query, valueListQuerySpec);
  const values = await valueService.topThree({ query: { ...filter, isActive: true } });

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
