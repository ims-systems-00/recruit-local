import { StatusCodes } from "http-status-codes";
import { ExperienceLevelAbilityBuilder, ExperienceLevelAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, UnauthorizedException } from "../../../common/helper";
import { runCursorList } from "../../../common/query";
import { experienceLevelListQuerySpec } from "./experience-level.query";
import * as experienceLevelService from "./experience-level.service";

export const list = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: experienceLevelListQuerySpec,
    // Public catalog: no CASL scoping, but only the active entries are listed.
    extraConditions: [{ isActive: true }],
    fetch: ({ query, options, offset }) => experienceLevelService.list({ query, options, offset }),
    count: ({ query }) => experienceLevelService.count({ query }),
  });

  return new ApiResponse({
    message: "Experience levels retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "experienceLevels",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const experienceLevel = await experienceLevelService.getOne({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Experience level retrieved.",
    statusCode: StatusCodes.OK,
    data: experienceLevel,
    fieldName: "experienceLevel",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const ability = new ExperienceLevelAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Create, ExperienceLevelAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create experience levels.");
  }

  const experienceLevel = await experienceLevelService.create(req.body);

  return new ApiResponse({
    message: "Experience level created.",
    statusCode: StatusCodes.CREATED,
    data: experienceLevel,
    fieldName: "experienceLevel",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new ExperienceLevelAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Update, new ExperienceLevelAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to update this experience level.");
  }

  const experienceLevel = await experienceLevelService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Experience level updated.",
    statusCode: StatusCodes.OK,
    data: experienceLevel,
    fieldName: "experienceLevel",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new ExperienceLevelAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.SoftDelete, new ExperienceLevelAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to delete this experience level.");
  }

  const experienceLevel = await experienceLevelService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Experience level moved to trash.",
    statusCode: StatusCodes.OK,
    data: experienceLevel,
    fieldName: "experienceLevel",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new ExperienceLevelAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.HardDelete, new ExperienceLevelAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this experience level.");
  }

  const experienceLevel = await experienceLevelService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Experience level permanently deleted.",
    statusCode: StatusCodes.OK,
    data: experienceLevel,
    fieldName: "experienceLevel",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new ExperienceLevelAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Restore, new ExperienceLevelAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to restore this experience level.");
  }

  const experienceLevel = await experienceLevelService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Experience level restored from trash.",
    statusCode: StatusCodes.OK,
    data: experienceLevel,
    fieldName: "experienceLevel",
  });
};
