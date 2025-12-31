import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as userService from "./user.service";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@inrm/authz";
import { AbilityAction } from "@inrm/types";
import { accessibleBy } from "@casl/mongoose";
import { mapCaslQueryToMongo } from "../../../common/helper/query-mapper";

export const listUser = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, UserAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read users.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["fullName"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const rawSecurityQuery = accessibleBy(ability, AbilityAction.Read).ofType(UserAuthZEntity);
  const securityQuery = mapCaslQueryToMongo(rawSecurityQuery);
  const finalQuery = {
    $and: [userSearchQuery, securityQuery],
  };

  const results = await userService.listUser({
    query: finalQuery as any,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Users retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "users",
    pagination,
  });
};

export const getUser = async ({ req }: ControllerParams) => {
  const user = await userService.getUser({ query: { _id: req.params.id } });
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (
    !ability.can(
      AbilityAction.Read,
      new UserAuthZEntity({
        tenantId: user?.tenantId?.toString() || null,
        id: user?._id.toString() || null,
      })
    )
  ) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read user.`);
  }

  return new ApiResponse({
    message: "User retrieved.",
    statusCode: StatusCodes.OK,
    data: user,
    fieldName: "user",
  });
};

export const updateUser = async ({ req }: ControllerParams) => {
  // const ability = new UserAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} user.`);

  const user = await userService.updateUser(req.params.id, req.body);

  return new ApiResponse({
    message: "User updated.",
    statusCode: StatusCodes.OK,
    data: user,
    fieldName: "user",
  });
};

export const softRemoveUser = async ({ req }: ControllerParams) => {
  // const ability = new UserAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} user.`);

  const { user, deleted } = await userService.softRemoveUser(req.params.id);

  return new ApiResponse({
    message: `${deleted} user moved to trash.`,
    statusCode: StatusCodes.OK,
    data: user,
    fieldName: "user",
  });
};

export const hardRemoveUser = async ({ req }: ControllerParams) => {
  // const existingUser = await userService.getUser(req.params.id);

  // const ability = new UserAbilityBuilder(req.session);
  // if (
  //   !ability.getAbility().can(
  //     AbilityAction.Delete,
  //     new UserAuthZEntity({
  //       tenantId: existingUser?.tenantId?.toString() || null,
  //     })
  //   )
  // )
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} user.`);

  const user = await userService.hardRemoveUser(req.params.id);

  return new ApiResponse({
    message: "User removed.",
    statusCode: StatusCodes.OK,
    data: user,
    fieldName: "user",
  });
};

export const restoreUser = async ({ req }: ControllerParams) => {
  // const ability = new UserAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} user.`);

  const { user, restored } = await userService.restoreUser(req.params.id);

  return new ApiResponse({
    message: `${restored} user restored.`,
    statusCode: StatusCodes.OK,
    data: user,
    fieldName: "user",
  });
};

export const updateUserProfileImage = async ({ req }: ControllerParams) => {
  // const ability = new UserAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //   throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} user.`);

  const user = await userService.updateUserProfileImage(req.params.id, req.body);

  return new ApiResponse({
    message: "User profile image updated.",
    statusCode: StatusCodes.OK,
    data: user,
    fieldName: "user",
  });
};
