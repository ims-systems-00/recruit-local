import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { TenantAbilityBuilder, TenantAuthZEntity } from "@rl/authz";
import { AbilityAction, USER_ROLE_ENUMS } from "@rl/types";
import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as tenantService from "./tenant.service";
import { update as updateUser } from "../user/user.service";
import { tenantRoleScopedSecurityQuery } from "./tenant.query";

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, TenantAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read tenants.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["name"],
    strictObjectIdMatch: true,
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const securityQuery = tenantRoleScopedSecurityQuery(ability);

  const finalQuery = {
    $and: [userSearchQuery, securityQuery],
  };

  const results = await tenantService.list({ query: finalQuery, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Organisations retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "tenants",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const tenant = await tenantService.getOne({ query: { _id: req.params.id } });

  if (!tenant || !ability.can(AbilityAction.Read, new TenantAuthZEntity({ _id: tenant._id?.toString() ?? null }))) {
    throw new UnauthorizedException("You do not have permission to view this organisation.");
  }

  return new ApiResponse({
    message: "Organisation retrieved.",
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const update = async ({ req }: ControllerParams) => {
  if (!req?.params?.id) {
    throw new Error("Tenant ID is required");
  }

  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingTenant = await tenantService.getOne({ query: { _id: req.params.id } });

  if (
    !existingTenant ||
    !ability.can(AbilityAction.Update, new TenantAuthZEntity({ _id: existingTenant._id?.toString() ?? null }))
  ) {
    throw new UnauthorizedException(`User is not authorized to update this organisation.`);
  }

  const tenant = await tenantService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Organisation updated.",
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const updateLogo = async ({ req }: ControllerParams) => {
  const logoStorage = req.params["logoStorage"] as "logoSquareStorage" | "logoRectangleStorage";

  if (!req?.params?.id) {
    throw new Error("Tenant ID is required");
  }

  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingTenant = await tenantService.getOne({ query: { _id: req.params.id } });

  if (
    !existingTenant ||
    !ability.can(AbilityAction.Update, new TenantAuthZEntity({ _id: existingTenant._id?.toString() ?? null }))
  ) {
    throw new UnauthorizedException(`User is not authorized to update this organisation's logo.`);
  }

  const tenant = await tenantService.updateLogo({
    tenantId: req.params.id,
    logoType: logoStorage === "logoSquareStorage" ? "square" : "rectangle",
    file: req.file,
    // session: req.session,
  });

  return new ApiResponse({
    message: "Organisation logo updated.",
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, TenantAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create organisations.");
  }
  const user = req.session.user!;

  if (req.session.tenantId) {
    throw new UnauthorizedException("You already belong to an organisation. Cannot create another one.");
  }

  const tenant = await tenantService.create({ payload: req.body });

  // await updateUser(user._id.toString(), {
  //   tenantId: tenant.id,
  //   role: USER_ROLE_ENUMS.ADMIN,
  // });

  await updateUser({
    query: { _id: user._id!.toString() },
    payload: {
      tenantId: tenant.id,
      role: USER_ROLE_ENUMS.ADMIN,
    },
  });

  return new ApiResponse({
    message: "Organisation created.",
    statusCode: StatusCodes.CREATED,
    data: tenant,
    fieldName: "tenant",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingTenant = await tenantService.getOne({ query: { _id: req.params.id } });

  if (
    !existingTenant ||
    !ability.can(AbilityAction.Delete, new TenantAuthZEntity({ _id: existingTenant._id!.toString() ?? null }))
  ) {
    throw new UnauthorizedException("You do not have permission to delete this organisation.");
  }

  const { tenant, deleted } = await tenantService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: `${deleted} organisation(s) moved to trash.`,
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Delete, new TenantAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this organisation.");
  }

  const tenant = await tenantService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Organisation removed.",
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const bulkRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Delete, TenantAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to perform bulk deletions on organisations.");
  }

  const deleteResponse = await tenantService.bulkHardDelete({ ids: req.body.ids });

  return new ApiResponse({
    message: "Organisations removed.",
    statusCode: StatusCodes.OK,
    data: {
      ids: req.body.ids,
      deleteResponse,
    },
    fieldName: "tenant",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new TenantAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Update, new TenantAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You do not have permission to restore this organisation.");
  }

  const { tenant, restored } = await tenantService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: `${restored} organisation restored.`,
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

// export const getAllUsersByTenantId = async ({ req }: ControllerParams) => {
//   const abilityBuilder = new TenantAbilityBuilder(req.session);
//   const ability = abilityBuilder.getAbility();

//   if (!ability.can(AbilityAction.Read, new TenantAuthZEntity({ _id: req.params.id }))) {
//     throw new UnauthorizedException("You do not have permission to view users for this organisation.");
//   }

//   const filter = new MongoQuery(req.query, {
//     searchFields: ["fullName"],
//     strictObjectIdMatch: true,
//   }).build();

//   const query = filter.getFilterQuery();
//   const options = filter.getQueryOptions();

//   // Note: ensure this service function is uncommented in tenant.service.ts
//   const results = await tenantService.getAllUsersByTenantId({
//     query: { ...query, tenantId: new mongoose.Types.ObjectId(req.params.id) },
//     options,
//   });

//   const { data, pagination } = formatListResponse(results);

//   return new ApiResponse({
//     message: "Users retrieved.",
//     statusCode: StatusCodes.OK,
//     data,
//     pagination,
//     fieldName: "users",
//   });
// };
