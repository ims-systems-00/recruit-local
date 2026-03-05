import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@rl/types";
import * as certificationService from "./certification.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "issuingOrganization"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} certifications.`
  //     );

  const results = await certificationService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Certifications retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "certifications",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  // Updated to use the object parameter
  const certification = await certificationService.getOne({
    query: { _id: req.params.id },
  });

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} certification.`
  //     );

  return new ApiResponse({
    message: "Certification retrieved.",
    statusCode: StatusCodes.OK,
    data: certification,
    fieldName: "certification",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} certification.`
  //     );

  // Updated to pass query and payload as properties of a single object
  const certification = await certificationService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Certification updated.",
    statusCode: StatusCodes.OK,
    data: certification,
    fieldName: "certification",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} certification.`
  //     );

  const userId = req.session.user?._id;

  // Updated to wrap the data inside the payload object
  const certification = await certificationService.create({
    payload: { ...req.body, userId: userId },
  });

  return new ApiResponse({
    message: "Certification created.",
    statusCode: StatusCodes.CREATED,
    data: certification,
    fieldName: "certification",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} certification.`
  //     );

  // Updated to call softDelete
  await certificationService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Certification deleted.",
    statusCode: StatusCodes.OK,
    data: null,
    fieldName: "certification",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Restore, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Restore} certification.`
  //     );

  // Updated to pass query object
  const certification = await certificationService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Certification restored.",
    statusCode: StatusCodes.OK,
    data: certification,
    fieldName: "certification",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} certification.`
  //     );

  // Updated to call hardDelete
  await certificationService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Certification permanently deleted.",
    statusCode: StatusCodes.OK,
    data: null,
    fieldName: "certification",
  });
};
