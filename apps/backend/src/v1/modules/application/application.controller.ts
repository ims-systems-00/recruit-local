import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@rl/types";
import * as applicationService from "./application.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["jobTitle", "companyName", "status"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} applications.`
  //     );

  const results = await applicationService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Applications retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "applications",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const application = await applicationService.getOne(req.params.id);
  //   const ability = new UserAbilityBuilder(req.session);

  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} application.`
  //     );

  return new ApiResponse({
    message: "Application retrieved.",
    statusCode: StatusCodes.OK,
    data: application,
    fieldName: "application",
  });
};
export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} application.`
  //     );

  const application = await applicationService.update(req.params.id, req.body);

  return new ApiResponse({
    message: "Application updated.",
    statusCode: StatusCodes.OK,
    data: application,
    fieldName: "application",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} application.`
  //     );

  const application = await applicationService.create(req.body);

  return new ApiResponse({
    message: "Application created.",
    statusCode: StatusCodes.CREATED,
    data: application,
    fieldName: "application",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} application.`
  //     );

  await applicationService.softRemove(req.params.id);

  return new ApiResponse({
    message: "Application deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Restore, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Restore} application.`
  //     );

  await applicationService.restore(req.params.id);

  return new ApiResponse({
    message: "Application restored.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.HardDelete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.HardDelete} application.`
  //     );

  await applicationService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "Application permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const statusUpdate = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} application.`
  //     );

  const application = await applicationService.statusUpdate(req.params.id, req.body.status);

  return new ApiResponse({
    message: "Application status updated.",
    statusCode: StatusCodes.OK,
    data: application,
    fieldName: "application",
  });
};
