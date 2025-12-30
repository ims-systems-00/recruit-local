import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@inrm/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@inrm/types";
import * as certificationService from "./certification.service";

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

  const results = await certificationService.list({ query, options });
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
  const experience = await certificationService.getOne(req.params.id);

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

  const experience = await certificationService.update(req.params.id, req.body);

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
  const userId = req.session.user?._id;
  const experience = await certificationService.create({ ...req.body, userId: userId });

  return new ApiResponse({
    message: "Experience created.",
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

  await certificationService.softRemove(req.params.id);

  return new ApiResponse({
    message: "Experience deleted.",
    statusCode: StatusCodes.OK,
    data: null,
    fieldName: "experience",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Restore, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Restore} experience.`
  //     );

  const experience = await certificationService.restore(req.params.id);

  return new ApiResponse({
    message: "Experience restored.",
    statusCode: StatusCodes.OK,
    data: experience,
    fieldName: "experience",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} experience.`
  //     );

  await certificationService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "Experience permanently deleted.",
    statusCode: StatusCodes.OK,
    data: null,
    fieldName: "experience",
  });
};
