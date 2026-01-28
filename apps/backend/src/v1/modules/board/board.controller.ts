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
import * as boardService from "./board.service";

export const list = async ({ req }: ControllerParams) => {
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment results.`);
  //   }
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const boardSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();
  //   const securityQuery = roleScopedSecurityQuery(EventRegistrationAuthZEntity, ability);

  const finalQuery = {
    $and: [boardSearchQuery /*securityQuery*/],
  };

  const results = await boardService.list({
    query: finalQuery as unknown,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Boards retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "boards",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const board = await boardService.getOne(sanitizeQueryIds({ _id: req.params.id }));
  if (!board) {
    throw new NotFoundException(`Board  ${req.params.id} not found.`);
  }
  //   const abilityBuilder = new UserAbilityBuilder(req.session);
  //   const ability = abilityBuilder.getAbility();
  //   if (!ability.can(AbilityAction.Read, EventRegistrationAuthZEntity)) {
  //     throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skill assessment results.`);
  //   }

  return new ApiResponse({
    message: "Board retrieved.",
    statusCode: StatusCodes.OK,
    data: board,
    fieldName: "board",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const newBoard = await boardService.create(req.body);

  return new ApiResponse({
    message: "Board created.",
    statusCode: StatusCodes.CREATED,
    data: newBoard,
    fieldName: "board",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const updatedBoard = await boardService.update({ _id: req.params.id }, req.body);

  if (!updatedBoard) {
    throw new NotFoundException(`Board  ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Board updated.",
    statusCode: StatusCodes.OK,
    data: updatedBoard,
    fieldName: "board",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const deleted = await boardService.softRemove({ _id: req.params.id });

  if (!deleted) {
    throw new NotFoundException(`Board  ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Board deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const restored = await boardService.restore({ _id: req.params.id });

  if (!restored) {
    throw new NotFoundException(`Board  ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Board restored.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const hardDeleted = await boardService.hardRemove({ _id: req.params.id });

  if (!hardDeleted) {
    throw new NotFoundException(`Board  ${req.params.id} not found.`);
  }

  return new ApiResponse({
    message: "Board permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};
