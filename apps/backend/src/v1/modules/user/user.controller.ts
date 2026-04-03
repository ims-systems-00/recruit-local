import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as userService from "./user.service";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity, ALL_USER_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { roleScopedSecurityQuery } from "./user.query";
import { permittedFieldsOf } from "@casl/ability/extra";
import { pick } from "lodash";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_USER_FIELDS,
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, UserAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read users.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["fullName"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), roleScopedSecurityQuery(ability)],
  };

  // 1. Fetch from DB using document-level security ONLY
  const results = await userService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  // 2. Sanitize fields in-memory per document
  const sanitizedDocs = results.docs.map((doc: any) => {
    const authZEntity = new UserAuthZEntity({
      _id: doc._id?.toString() || null,
      tenantId: doc.tenantId?.toString() || null,
      type: doc.type,
    });

    const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);

    // Convert Mongoose document to POJO if necessary, then pick allowed fields
    const plainDoc = doc.toObject ? doc.toObject() : doc;
    return pick(plainDoc, docAllowedFields);
  });

  // 3. Re-attach sanitized docs back to the results object
  results.docs = sanitizedDocs;

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Users retrieved",
    statusCode: StatusCodes.OK,
    data: data,
    fieldName: "users",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const user = await userService.getOne({
    query: { _id: req.params.id },
  });

  const authZEntity = new UserAuthZEntity({
    tenantId: user?.tenantId?.toString() || null,
    _id: user?._id?.toString() || null,
    type: user?.type,
  });

  if (!user || !ability.can(AbilityAction.Read, authZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read user.`);
  }

  const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
  const plainDoc = user.toObject ? user.toObject() : user;
  const sanitizedUser = pick(plainDoc, docAllowedFields);

  return new ApiResponse({
    message: "User retrieved.",
    statusCode: StatusCodes.OK,
    data: sanitizedUser,
    fieldName: "user",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, UserAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read deleted users.`);
  }

  const filter = new MongoQuery(req.query, { searchFields: ["fullName"] }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), roleScopedSecurityQuery(ability)],
  };

  // 1. Fetch from DB using document-level security ONLY
  const results = await userService.listSoftDeleted({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  // 2. Sanitize fields in-memory per document
  const sanitizedDocs = results.docs.map((doc: any) => {
    const authZEntity = new UserAuthZEntity({
      _id: doc._id?.toString() || null,
      tenantId: doc.tenantId?.toString() || null,
      type: doc.type,
    });

    const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);

    const plainDoc = doc.toObject ? doc.toObject() : doc;
    return pick(plainDoc, docAllowedFields);
  });

  // 3. Re-attach sanitized docs back to the results object
  results.docs = sanitizedDocs;

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted users retrieved",
    statusCode: StatusCodes.OK,
    data: data,
    fieldName: "users",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const user = await userService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  const authZEntity = new UserAuthZEntity({
    tenantId: user?.tenantId?.toString() || null,
    _id: user?._id?.toString() || null,
    type: user?.type,
  });

  if (!user || !ability.can(AbilityAction.Read, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to view this deleted user.");
  }

  const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
  const plainDoc = user.toObject ? user.toObject() : user;
  const sanitizedUser = pick(plainDoc, docAllowedFields);

  return new ApiResponse({
    message: "Deleted user retrieved.",
    statusCode: StatusCodes.OK,
    data: sanitizedUser,
    fieldName: "user",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, UserAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create a user.");
  }

  const user = await userService.create({
    payload: req.body,
  });

  const authZEntity = new UserAuthZEntity({
    tenantId: user?.tenantId?.toString() || null,
    _id: user?._id?.toString() || null,
    type: user?.type,
  });

  const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
  const plainDoc = user.toObject ? user.toObject() : user;
  const sanitizedUser = pick(plainDoc, docAllowedFields);

  return new ApiResponse({
    message: "User created.",
    statusCode: StatusCodes.CREATED,
    data: sanitizedUser,
    fieldName: "user",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOne({ query: { _id: req.params.id } });

  const authZEntityBefore = new UserAuthZEntity({
    tenantId: existingUser?.tenantId?.toString() || null,
    _id: existingUser?._id?.toString() || null,
    type: existingUser?.type,
  });

  if (!existingUser || !ability.can(AbilityAction.Update, authZEntityBefore)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update user.`);
  }

  const user = await userService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  const authZEntityAfter = new UserAuthZEntity({
    tenantId: user?.tenantId?.toString() || null,
    _id: user?._id?.toString() || null,
    type: user?.type,
  });

  const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntityAfter, caslFieldOptions);
  const plainDoc = user.toObject ? user.toObject() : user;
  const sanitizedUser = pick(plainDoc, docAllowedFields);

  return new ApiResponse({
    message: "User updated.",
    statusCode: StatusCodes.OK,
    data: sanitizedUser,
    fieldName: "user",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOne({ query: { _id: req.params.id } });

  const authZEntity = new UserAuthZEntity({
    tenantId: existingUser?.tenantId?.toString() || null,
    _id: existingUser?._id?.toString() || null,
    type: existingUser?.type,
  });

  if (!existingUser || !ability.can(AbilityAction.Delete, authZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete user.`);
  }

  const user = await userService.softDelete({
    query: { _id: req.params.id },
  });

  const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
  const plainDoc = user.toObject ? user.toObject() : user;
  const sanitizedUser = pick(plainDoc, docAllowedFields);

  return new ApiResponse({
    message: "User moved to trash.",
    statusCode: StatusCodes.OK,
    data: sanitizedUser,
    fieldName: "user",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOneSoftDeleted({ query: { _id: req.params.id } });

  const authZEntity = new UserAuthZEntity({
    tenantId: existingUser?.tenantId?.toString() || null,
    _id: existingUser?._id?.toString() || null,
    type: existingUser?.type,
  });

  if (!existingUser || !ability.can(AbilityAction.Delete, authZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to delete user.`);
  }

  const user = await userService.hardDelete({
    query: { _id: req.params.id },
  });

  const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
  const plainDoc = user.toObject ? user.toObject() : user;
  const sanitizedUser = pick(plainDoc, docAllowedFields);

  return new ApiResponse({
    message: "User permanently deleted.",
    statusCode: StatusCodes.OK,
    data: sanitizedUser,
    fieldName: "user",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOneSoftDeleted({ query: { _id: req.params.id } });

  const authZEntity = new UserAuthZEntity({
    tenantId: existingUser?.tenantId?.toString() || null,
    _id: existingUser?._id?.toString() || null,
    type: existingUser?.type,
  });

  if (!existingUser || !ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to restore user.`);
  }

  const user = await userService.restore({
    query: { _id: req.params.id },
  });

  const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
  const plainDoc = user.toObject ? user.toObject() : user;
  const sanitizedUser = pick(plainDoc, docAllowedFields);

  return new ApiResponse({
    message: "User restored from trash.",
    statusCode: StatusCodes.OK,
    data: sanitizedUser,
    fieldName: "user",
  });
};

export const updateUserProfileImage = async ({ req }: ControllerParams) => {
  const abilityBuilder = new UserAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingUser = await userService.getOne({ query: { _id: req.params.id } });

  const authZEntityBefore = new UserAuthZEntity({
    tenantId: existingUser?.tenantId?.toString() || null,
    _id: existingUser?._id?.toString() || null,
    type: existingUser?.type,
  });

  if (!existingUser || !ability.can(AbilityAction.Update, authZEntityBefore)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to update user profile image.`);
  }

  const updatedUser = await userService.updateUserProfileImage({
    query: { _id: req.params.id },
    payload: req.body,
  });

  const authZEntityAfter = new UserAuthZEntity({
    tenantId: updatedUser?.tenantId?.toString() || null,
    _id: updatedUser?._id?.toString() || null,
    type: updatedUser?.type,
  });

  const docAllowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntityAfter, caslFieldOptions);
  const plainDoc = updatedUser.toObject ? updatedUser.toObject() : updatedUser;
  const sanitizedUser = pick(plainDoc, docAllowedFields);

  return new ApiResponse({
    message: "User profile image updated.",
    statusCode: StatusCodes.OK,
    data: sanitizedUser,
    fieldName: "user",
  });
};
