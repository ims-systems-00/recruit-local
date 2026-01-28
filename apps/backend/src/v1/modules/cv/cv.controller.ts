import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@rl/types";
import * as cvService from "./cv.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "summary", "skills"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} cvs.`
  //     );

  const results = await cvService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "CVs retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "cvs",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const cv = await cvService.getOne({ query: { _id: req.params.id } });

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} cv.`
  //     );

  return new ApiResponse({
    message: "CV retrieved.",
    statusCode: StatusCodes.OK,
    data: cv,
    fieldName: "cv",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} cv.`
  //     );

  const cv = await cvService.update({ query: { _id: req.params.id }, payload: req.body });

  return new ApiResponse({
    message: "CV updated.",
    statusCode: StatusCodes.OK,
    data: cv,
    fieldName: "cv",
  });
};
export const create = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} cv.`
  //     );
  const userId = req.session.user?._id;
  const cv = await cvService.create({ ...req.body, userId });

  return new ApiResponse({
    message: "CV created successfully.",
    statusCode: StatusCodes.CREATED,
    data: cv,
    fieldName: "cv",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} cv.`
  //     );

  await cvService.softRemove(req.params.id);

  return new ApiResponse({
    message: "CV removed successfully.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Restore, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Restore} cv.`
  //     );

  await cvService.restore(req.params.id);

  return new ApiResponse({
    message: "CV restored successfully.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.ForceDelete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.ForceDelete} cv.`
  //     );

  await cvService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "CV deleted permanently.",
    statusCode: StatusCodes.OK,
  });
};
