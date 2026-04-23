import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as userService from "./user.service";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity, ALL_USER_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { roleScopedSecurityQuery } from "./user.query";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_USER_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single user document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedUserResponse = (doc: any, ability: any) => {
  return sanitizeDocument<UserAuthZEntity>(doc, ability, AbilityAction.Read, UserAuthZEntity, caslFieldOptions);
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, UserAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read users.`);
  }

  const filter = new MongoQuery(req.query, { searchFields: ["fullName"] }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), roleScopedSecurityQuery(ability)],
  };

  const results = await userService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<UserAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    UserAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Users retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "users",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const user = await userService.getOne({ query: { _id: req.params.id } });

  // Always authorize against the instance if it exists
  if (!user || !ability.can(AbilityAction.Read, new UserAuthZEntity(user))) {
    throw new UnauthorizedException(`User is not authorized to read this record.`);
  }

  return new ApiResponse({
    message: "User retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedUserResponse(user, ability),
    fieldName: "user",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, UserAuthZEntity)) {
    throw new UnauthorizedException(`User is not authorized to read deleted users.`);
  }

  const filter = new MongoQuery(req.query, { searchFields: ["fullName"] }).build();
  const finalQuery = { $and: [filter.getFilterQuery(), roleScopedSecurityQuery(ability)] };

  const results = await userService.listSoftDeleted({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<UserAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    UserAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Soft deleted users retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "users",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const user = await userService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!user || !ability.can(AbilityAction.Read, new UserAuthZEntity(user))) {
    throw new UnauthorizedException("You do not have permission to view this deleted user.");
  }

  return new ApiResponse({
    message: "Deleted user retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedUserResponse(user, ability),
    fieldName: "user",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, UserAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create a user.");
  }

  const user = await userService.create({ payload: req.body });

  return new ApiResponse({
    message: "User created.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedUserResponse(user, ability),
    fieldName: "user",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Fetch the data as it exists now
  const existingUser = await userService.getOne({ query: { _id: req.params.id } });
  if (!existingUser) throw new NotFoundException("User not found");

  const authZEntity = new UserAuthZEntity(existingUser);

  // Row-Level Check: Can they update THIS specific user?
  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException(`Not authorized to update this user.`);
  }

  // Field-Level Check: Are they trying to update any fields they're not allowed to?
  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  // Perform the update
  const user = await userService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  // 5. Return the result (Read Sanitization)
  return new ApiResponse({
    message: "User updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedUserResponse(user, ability),
    fieldName: "user",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOne({ query: { _id: req.params.id } });

  if (!existingUser || !ability.can(AbilityAction.SoftDelete, new UserAuthZEntity(existingUser))) {
    throw new UnauthorizedException(`Not authorized to delete this user.`);
  }

  const user = await userService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User moved to trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedUserResponse(user, ability),
    fieldName: "user",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingUser || !ability.can(AbilityAction.HardDelete, new UserAuthZEntity(existingUser))) {
    throw new UnauthorizedException(`Not authorized to permanently delete this user.`);
  }

  const user = await userService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedUserResponse(user, ability),
    fieldName: "user",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingUser || !ability.can(AbilityAction.Restore, new UserAuthZEntity(existingUser))) {
    throw new UnauthorizedException(`Not authorized to restore this user.`);
  }

  const user = await userService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User restored from trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedUserResponse(user, ability),
    fieldName: "user",
  });
};

export const updateUserProfileImage = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOne({ query: { _id: req.params.id } });

  const authZEntity = new UserAuthZEntity(existingUser);

  if (!existingUser || !ability.can(AbilityAction.Update, authZEntity, "profileImage")) {
    throw new UnauthorizedException(`Not authorized to update profile image.`);
  }

  const updatedUser = await userService.updateUserProfileImage({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "User profile image updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedUserResponse(updatedUser, ability),
    fieldName: "user",
  });
};
