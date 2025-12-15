import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { TenantAbilityBuilder, TenantAuthZEntity } from "@inrm/authz";
import { AbilityAction, USER_TYPE_ENUMS } from "@inrm/types";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as tenantService from "./tenant.service";

export const listTenant = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name"],
    strictObjectIdMatch: true,
  }).build();

  let query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  // const ability = new TenantAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Read, TenantAuthZEntity))
  //   throw new UnauthorizedException(
  //     `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} tenants.`
  //   );
  // if (req.session.user.type === USER_TYPE_ENUMS.ADMIN) {
  //   query = { ...query, _id: new mongoose.Types.ObjectId(req.session.tenantId) };
  // }
  // console.log("query", query);
  const results = await tenantService.listTenant({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Organisations retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "tenants",
    pagination,
  });
};

export const getTenant = async ({ req }: ControllerParams) => {
  const tenant = await tenantService.getTenant(req.params.id);

  // const ability = new TenantAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Read, TenantAuthZEntity))
  //   throw new UnauthorizedException(
  //     `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} tenants.`
  //   );

  return new ApiResponse({
    message: "Organisation retrieved.",
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const updateTenant = async ({ req }: ControllerParams) => {
  if (!req?.params?.id) {
    throw new Error("Tenant ID is required");
  }

  // const existingTenant = await tenantService.getTenant(req.params.id);
  // const ability = new TenantAbilityBuilder(req.session);

  // if (
  //   !ability.getAbility().can(
  //     AbilityAction.Update,
  //     new TenantAuthZEntity({
  //       _id: existingTenant?._id as string,
  //     })
  //   )
  // )
  //   throw new UnauthorizedException(
  //     `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} tenants.`
  //   );

  const tenant = await tenantService.updateTenant(req.params.id, req.body);

  return new ApiResponse({
    message: "Organisation updated.",
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const updateTenantLogo = async ({ req }: ControllerParams) => {
  const logoStorage = req.params["logoStorage"];

  if (!req?.params?.id) {
    throw new Error("Tenant ID is required");
  }

  // const existingTenant = await tenantService.getTenant(req.params.id);
  // const ability = new TenantAbilityBuilder(req.session);

  // if (
  //   !ability.getAbility().can(
  //     AbilityAction.Update,
  //     new TenantAuthZEntity({
  //       _id: existingTenant?._id as string,
  //     })
  //   )
  // )
  //   throw new UnauthorizedException(
  //     `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} tenants.`
  //   );

  const tenant = await tenantService.updateTenantLogo(req.params.id, logoStorage, req.body);

  return new ApiResponse({
    message: "Organisation logo updated.",
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const createTenant = async ({ req }: ControllerParams) => {
  // const ability = new TenantAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Create, TenantAuthZEntity))
  //   throw new UnauthorizedException(
  //     `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} tenants.`
  //   );

  const tenant = await tenantService.createTenant(req.body);

  return new ApiResponse({
    message: "Organisation created.",
    statusCode: StatusCodes.CREATED,
    data: tenant,
    fieldName: "tenant",
  });
};

export const softRemoveTenant = async ({ req }: ControllerParams) => {
  // const ability = new TenantAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Delete, TenantAuthZEntity))
  //   throw new UnauthorizedException(
  //     `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} tenants.`
  //   );

  const { tenant, deleted } = await tenantService.softRemoveTenant(req.params.id);

  return new ApiResponse({
    message: `${deleted} organisation(s) moved to trash.`,
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const hardRemoveTenant = async ({ req }: ControllerParams) => {
  // const ability = new TenantAbilityBuilder(req.session);
  // if (!ability.getAbility().can(AbilityAction.Delete, TenantAuthZEntity))
  //   throw new UnauthorizedException(
  //     `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} tenants.`
  //   );

  const tenant = await tenantService.hardRemoveTenant(req.params.id);

  return new ApiResponse({
    message: "Organisation removed.",
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const bulkRemoveTenants = async ({ req }: ControllerParams) => {
  const ability = new TenantAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Delete, TenantAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} tenants.`
    );

  const deleteResponse = await tenantService.bulkRemoveTenants(req.body.ids);

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

export const restoreTenant = async ({ req }: ControllerParams) => {
  const ability = new TenantAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Create, TenantAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} tenants.`
    );

  const { tenant, restored } = await tenantService.restoreTenant(req.params.id);

  return new ApiResponse({
    message: `${restored} organisation restored.`,
    statusCode: StatusCodes.OK,
    data: tenant,
    fieldName: "tenant",
  });
};

export const getAllUsersByTenantId = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["fullName"],
    strictObjectIdMatch: true,
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const ability = new TenantAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Read, TenantAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} tenants.`
    );

  const results = await tenantService.getAllUsersByTenantId({
    query: { ...query, tenantId: new mongoose.Types.ObjectId(req.params.id) },
    options,
  });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Users retrieved.",
    statusCode: StatusCodes.OK,
    data,
    pagination,
    fieldName: "users",
  });
};
