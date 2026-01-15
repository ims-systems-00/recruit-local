import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@rl/types";

import * as educationService from "./education.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["degree", "institution", "fieldOfStudy"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} educations.`
  //     );

  const results = await educationService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Educations retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "educations",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const education = await educationService.getOne(req.params.id);

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} education.`
  //     );

  return new ApiResponse({
    message: "Education retrieved.",
    statusCode: StatusCodes.OK,
    data: education,
    fieldName: "education",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} education.`
  //     );

  const education = await educationService.update(req.params.id, req.body);

  return new ApiResponse({
    message: "Education updated successfully.",
    statusCode: StatusCodes.OK,
    data: education,
    fieldName: "education",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} education.`
  //     );
  const userId = req.session.user?._id;
  req.body.userId = userId;
  const education = await educationService.create(req.body);

  return new ApiResponse({
    message: "Education created successfully.",
    statusCode: StatusCodes.CREATED,
    data: education,
    fieldName: "education",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} education.`
  //     );

  await educationService.softRemove(req.params.id);

  return new ApiResponse({
    message: "Education removed successfully.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} education.`
  //     );

  await educationService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "Education permanently removed.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} education.`
  //     );

  const education = await educationService.restore(req.params.id);

  return new ApiResponse({
    message: "Education restored successfully.",
    statusCode: StatusCodes.OK,
    data: education,
    fieldName: "education",
  });
};
