import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@inrm/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@inrm/types";
import * as experienceService from "./experience.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["company", "position", "responsibilities"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} experiences.`
  //     );

  const results = await experienceService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Experiences retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "experiences",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const experience = await experienceService.getOne(req.params.id);

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} experience.`
  //     );

  return new ApiResponse({
    message: "Experience retrieved.",
    statusCode: StatusCodes.OK,
    data: experience,
    fieldName: "experience",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} experience.`
  //     );

  const experience = await experienceService.update(req.params.id, req.body);

  return new ApiResponse({
    message: "Experience updated.",
    statusCode: StatusCodes.OK,
    data: experience,
    fieldName: "experience",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} experience.`
  //     );
  const userId = req.session.user?.id;

  const experience = await experienceService.create({
    ...req.body,
    userId: userId!,
  });

  return new ApiResponse({
    message: "Experience created successfully.",
    statusCode: StatusCodes.CREATED,
    data: experience,
    fieldName: "experience",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} experience.`
  //     );

  await experienceService.softRemove(req.params.id);

  return new ApiResponse({
    message: "Experience removed successfully.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Restore, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Restore} experience.`
  //     );

  await experienceService.restore(req.params.id);

  return new ApiResponse({
    message: "Experience restored successfully.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} experience.`
  //     );

  await experienceService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "Experience permanently deleted successfully.",
    statusCode: StatusCodes.OK,
  });
};
