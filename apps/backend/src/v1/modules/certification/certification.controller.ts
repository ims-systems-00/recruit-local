import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import { CertificationAbilityBuilder, CertificationAuthZEntity, ALL_CERTIFICATION_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import * as certificationService from "./certification.service";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { certificationRoleScopedSecurityQuery } from "./certification.query";
import { assertCanReadJobProfile, assertProfileScopedListAccess } from "../job-profile/job-profile.access";
import { toCertificationResponse, toCertificationResponseList } from "./certification.dto";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_CERTIFICATION_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single certification document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedCertificationResponse = (doc: any, ability: any) => {
  return sanitizeDocument<CertificationAuthZEntity>(
    doc,
    ability,
    AbilityAction.Read,
    CertificationAuthZEntity,
    caslFieldOptions
  );
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CertificationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, CertificationAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read certifications.`);
  }

  // Reading someone else's certifications is only allowed while their profile is.
  await assertProfileScopedListAccess(req.session, req.query.jobProfileId);

  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "issuingOrganization"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), certificationRoleScopedSecurityQuery(ability)],
  };

  const results = await certificationService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<CertificationAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    CertificationAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Certifications retrieved",
    statusCode: StatusCodes.OK,
    data: toCertificationResponseList(data),
    fieldName: "certifications",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CertificationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const certification = await certificationService.getOne({ query: { _id: req.params.id } });

  if (!certification || !ability.can(AbilityAction.Read, new CertificationAuthZEntity(certification))) {
    throw new UnauthorizedException("You do not have permission to view this certification.");
  }

  if (String(certification.jobProfileId) !== req.session.jobProfileId) {
    await assertCanReadJobProfile(req.session, String(certification.jobProfileId));
  }

  return new ApiResponse({
    message: "Certification retrieved.",
    statusCode: StatusCodes.OK,
    data: toCertificationResponse(getSanitizedCertificationResponse(certification, ability)),
    fieldName: "certification",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CertificationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, CertificationAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create certifications.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Create, new CertificationAuthZEntity(req.body));

  const certification = await certificationService.create({
    payload: { ...req.body, userId: req.session.user?._id },
  });

  return new ApiResponse({
    message: "Certification created.",
    statusCode: StatusCodes.CREATED,
    data: toCertificationResponse(getSanitizedCertificationResponse(certification, ability)),
    fieldName: "certification",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CertificationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingCertification = await certificationService.getOne({ query: { _id: req.params.id } });
  if (!existingCertification) throw new NotFoundException("Certification not found");

  const authZEntity = new CertificationAuthZEntity(existingCertification);

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to update this certification.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const certification = await certificationService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Certification updated.",
    statusCode: StatusCodes.OK,
    data: toCertificationResponse(getSanitizedCertificationResponse(certification, ability)),
    fieldName: "certification",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CertificationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingCertification = await certificationService.getOne({ query: { _id: req.params.id } });

  if (
    !existingCertification ||
    !ability.can(AbilityAction.SoftDelete, new CertificationAuthZEntity(existingCertification))
  ) {
    throw new UnauthorizedException("You do not have permission to delete this certification.");
  }

  const certification = await certificationService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Certification deleted.",
    statusCode: StatusCodes.OK,
    data: toCertificationResponse(getSanitizedCertificationResponse(certification, ability)),
    fieldName: "certification",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CertificationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingCertification = await certificationService.getSoftDeletedOne({ query: { _id: req.params.id } });

  if (
    !existingCertification ||
    !ability.can(AbilityAction.HardDelete, new CertificationAuthZEntity(existingCertification))
  ) {
    throw new UnauthorizedException("You do not have permission to permanently delete this certification.");
  }

  const certification = await certificationService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Certification permanently deleted.",
    statusCode: StatusCodes.OK,
    data: toCertificationResponse(getSanitizedCertificationResponse(certification, ability)),
    fieldName: "certification",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new CertificationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingCertification = await certificationService.getSoftDeletedOne({ query: { _id: req.params.id } });

  if (
    !existingCertification ||
    !ability.can(AbilityAction.Restore, new CertificationAuthZEntity(existingCertification))
  ) {
    throw new UnauthorizedException("You do not have permission to restore this certification.");
  }

  const certification = await certificationService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Certification restored.",
    statusCode: StatusCodes.OK,
    data: toCertificationResponse(getSanitizedCertificationResponse(certification, ability)),
    fieldName: "certification",
  });
};
