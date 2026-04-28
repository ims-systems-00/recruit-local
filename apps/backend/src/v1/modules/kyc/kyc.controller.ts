import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { AbilityAction } from "@rl/types";
import * as kycService from "./kyc.service";
import { kycRoleScopedSecurityQuery } from "./kyc.query";
import { KycAbilityBuilder, KycAuthZEntity, ALL_KYC_FIELDS } from "@rl/authz";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_KYC_FIELDS,
};

const getSanitizedKycResponse = (doc: any, ability: any) => {
  return sanitizeDocument<KycAuthZEntity>(doc, ability, AbilityAction.Read, KycAuthZEntity, caslFieldOptions);
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new KycAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, KycAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read KYC records.`);
  }

  const filter = new MongoQuery(req.query, { searchFields: ["firstName", "lastName"] }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), kycRoleScopedSecurityQuery(ability)],
  };

  const results = await kycService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<KycAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    KycAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "KYC records retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "kycs",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new KycAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const kyc = await kycService.getOne({ query: { _id: req.params.id } });

  if (!kyc || !ability.can(AbilityAction.Read, new KycAuthZEntity(kyc))) {
    throw new UnauthorizedException("You do not have permission to view this KYC record.");
  }

  return new ApiResponse({
    message: "KYC record retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedKycResponse(kyc, ability),
    fieldName: "kyc",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new KycAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, KycAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create a KYC record.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Create, new KycAuthZEntity(req.body));

  const kyc = await kycService.create({
    payload: {
      ...req.body,
      userId: req.session.user._id,
    },
  });

  return new ApiResponse({
    message: "KYC record created successfully.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedKycResponse(kyc, ability),
    fieldName: "kyc",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new KycAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingKyc = await kycService.getOne({ query: { _id: req.params.id } });
  if (!existingKyc) throw new NotFoundException("KYC record not found");

  const authZEntity = new KycAuthZEntity(existingKyc);

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("User is not authorized to update this KYC record.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const kyc = await kycService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "KYC record updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedKycResponse(kyc, ability),
    fieldName: "kyc",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new KycAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingKyc = await kycService.getOne({ query: { _id: req.params.id } });

  if (!existingKyc || !ability.can(AbilityAction.SoftDelete, new KycAuthZEntity(existingKyc))) {
    throw new UnauthorizedException("You do not have permission to delete this KYC record.");
  }

  const kyc = await kycService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "KYC record moved to trash.",
    statusCode: StatusCodes.OK,
    data: kyc,
    fieldName: "kyc",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new KycAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingKyc = await kycService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingKyc || !ability.can(AbilityAction.Restore, new KycAuthZEntity(existingKyc))) {
    throw new UnauthorizedException("You do not have permission to restore this KYC record.");
  }

  const kyc = await kycService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "KYC record restored successfully.",
    statusCode: StatusCodes.OK,
    data: getSanitizedKycResponse(kyc, ability),
    fieldName: "kyc",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new KycAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingKyc = await kycService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingKyc || !ability.can(AbilityAction.HardDelete, new KycAuthZEntity(existingKyc))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this KYC record.");
  }

  const kyc = await kycService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "KYC record permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedKycResponse(kyc, ability),
    fieldName: "kyc",
  });
};
