import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import { EducationAbilityBuilder, EducationAuthZEntity, ALL_EDUCATION_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import * as educationService from "./education.service";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { educationRoleScopedSecurityQuery } from "./education.query";
import { toEducationResponse, toEducationResponseList } from "./education.dto";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_EDUCATION_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single education document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedEducationResponse = (doc: any, ability: any) => {
  return sanitizeDocument<EducationAuthZEntity>(
    doc,
    ability,
    AbilityAction.Read,
    EducationAuthZEntity,
    caslFieldOptions
  );
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new EducationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, EducationAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read educations.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["degree", "institution", "fieldOfStudy"],
  }).build();

  // Apply Role/Ownership Scoped Security Query
  const finalQuery = {
    $and: [filter.getFilterQuery(), educationRoleScopedSecurityQuery(ability)],
  };

  const results = await educationService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<EducationAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    EducationAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Educations retrieved",
    statusCode: StatusCodes.OK,
    data: toEducationResponseList(data),
    fieldName: "educations",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new EducationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const education = await educationService.getOne({ query: { _id: req.params.id } });

  if (!education || !ability.can(AbilityAction.Read, new EducationAuthZEntity(education))) {
    throw new UnauthorizedException("You do not have permission to view this education record.");
  }

  return new ApiResponse({
    message: "Education retrieved.",
    statusCode: StatusCodes.OK,
    data: toEducationResponse(getSanitizedEducationResponse(education, ability)),
    fieldName: "education",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new EducationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingEducation = await educationService.getOne({ query: { _id: req.params.id } });
  if (!existingEducation) throw new NotFoundException("Education Profile not found");

  const authZEntity = new EducationAuthZEntity(existingEducation);

  // Row-Level Check
  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("User is not authorized to update this education record.");
  }

  // Field-Level Check
  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const education = await educationService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Education updated successfully.",
    statusCode: StatusCodes.OK,
    data: toEducationResponse(getSanitizedEducationResponse(education, ability)),
    fieldName: "education",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new EducationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // General Create check
  if (!ability.can(AbilityAction.Create, EducationAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create education records.");
  }

  // Field-level check for creation payload
  validateUpdatePayload(req.body, ability, AbilityAction.Create, new EducationAuthZEntity(req.body));

  const education = await educationService.create({
    ...req.body,
    userId: req.session.user?._id,
  });

  return new ApiResponse({
    message: "Education created successfully.",
    statusCode: StatusCodes.CREATED,
    data: toEducationResponse(getSanitizedEducationResponse(education, ability)),
    fieldName: "education",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new EducationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingEducation = await educationService.getOne({ query: { _id: req.params.id } });

  if (!existingEducation || !ability.can(AbilityAction.SoftDelete, new EducationAuthZEntity(existingEducation))) {
    throw new UnauthorizedException("You do not have permission to delete this education record.");
  }

  const education = await educationService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Education removed successfully.",
    statusCode: StatusCodes.OK,
    data: toEducationResponse(getSanitizedEducationResponse(education, ability)),
    fieldName: "education",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new EducationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingEducation = await educationService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingEducation || !ability.can(AbilityAction.Restore, new EducationAuthZEntity(existingEducation))) {
    throw new UnauthorizedException("You do not have permission to restore this education record.");
  }

  const education = await educationService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Education restored successfully.",
    statusCode: StatusCodes.OK,
    data: toEducationResponse(getSanitizedEducationResponse(education, ability)),
    fieldName: "education",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new EducationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingEducation = await educationService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingEducation || !ability.can(AbilityAction.HardDelete, new EducationAuthZEntity(existingEducation))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this education record.");
  }

  const education = await educationService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Education permanently removed.",
    statusCode: StatusCodes.OK,
    data: toEducationResponse(getSanitizedEducationResponse(education, ability)),
    fieldName: "education",
  });
};
