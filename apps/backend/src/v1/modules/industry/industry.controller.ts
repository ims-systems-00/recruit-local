import { StatusCodes } from "http-status-codes";
import { IndustryAbilityBuilder, IndustryAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, UnauthorizedException } from "../../../common/helper";
import { runCursorList } from "../../../common/query";
import { industryListQuerySpec } from "./industry.query";
import * as industryService from "./industry.service";

export const list = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: industryListQuerySpec,
    // Public catalog: no CASL scoping, but only the active entries are listed.
    extraConditions: [{ isActive: true }],
    fetch: ({ query, options, offset }) => industryService.list({ query, options, offset }),
    count: ({ query }) => industryService.count({ query }),
  });

  return new ApiResponse({
    message: "Industries retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "industries",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const industry = await industryService.getOne({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Industry retrieved.",
    statusCode: StatusCodes.OK,
    data: industry,
    fieldName: "industry",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const ability = new IndustryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Create, IndustryAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create industries.");
  }

  const industry = await industryService.create(req.body);

  return new ApiResponse({
    message: "Industry created.",
    statusCode: StatusCodes.CREATED,
    data: industry,
    fieldName: "industry",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new IndustryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Update, new IndustryAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to update this industry.");
  }

  const industry = await industryService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Industry updated.",
    statusCode: StatusCodes.OK,
    data: industry,
    fieldName: "industry",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new IndustryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.SoftDelete, new IndustryAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to delete this industry.");
  }

  const industry = await industryService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Industry moved to trash.",
    statusCode: StatusCodes.OK,
    data: industry,
    fieldName: "industry",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new IndustryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.HardDelete, new IndustryAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this industry.");
  }

  const industry = await industryService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Industry permanently deleted.",
    statusCode: StatusCodes.OK,
    data: industry,
    fieldName: "industry",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new IndustryAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Restore, new IndustryAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to restore this industry.");
  }

  const industry = await industryService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Industry restored from trash.",
    statusCode: StatusCodes.OK,
    data: industry,
    fieldName: "industry",
  });
};
