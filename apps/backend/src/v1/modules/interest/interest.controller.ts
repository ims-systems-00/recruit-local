import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@rl/types";
import * as interestService from "./interest.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} interests.`
  //     );

  const results = await interestService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Interests retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "interests",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const interest = await interestService.getOne(req.params.id);

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} interest.`
  //     );

  return new ApiResponse({
    message: "Interest retrieved.",
    statusCode: StatusCodes.OK,
    data: interest,
    fieldName: "interest",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} interest.`
  //     );
  const interest = await interestService.update(req.params.id, req.body);
  return new ApiResponse({
    message: "Interest updated.",
    statusCode: StatusCodes.OK,
    data: interest,
    fieldName: "interest",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} interest.`
  //     );
  const userId = req.session.user?._id;

  const interest = await interestService.create({
    ...req.body,
    userId: userId!,
  });
  return new ApiResponse({
    message: "Interest created.",
    statusCode: StatusCodes.CREATED,
    data: interest,
    fieldName: "interest",
  });
};
export const softRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} interest.`
  //     );
  const { interest, deleted } = await interestService.softRemove(req.params.id);
  return new ApiResponse({
    message: "Interest soft deleted.",
    statusCode: StatusCodes.OK,
    data: { interest, deleted },
    fieldName: "interest",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} interest.`
  //     );
  const interest = await interestService.hardRemove(req.params.id);
  return new ApiResponse({
    message: "Interest hard deleted.",
    statusCode: StatusCodes.OK,
    data: interest,
    fieldName: "interest",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} interest.`
  //     );
  const { interest, restored } = await interestService.restore(req.params.id);
  return new ApiResponse({
    message: "Interest restored.",
    statusCode: StatusCodes.OK,
    data: { interest, restored },
    fieldName: "interest",
  });
};
