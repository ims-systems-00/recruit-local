import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import { ExperienceAbilityBuilder, ExperienceAuthZEntity, ALL_EXPERIENCE_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import * as experienceService from "./experience.service";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { experienceRoleScopedSecurityQuery } from "./experience.query";
import { assertCanReadJobProfile, assertProfileScopedListAccess } from "../job-profile/job-profile.access";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_EXPERIENCE_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single experience document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedExperienceResponse = (doc: any, ability: any) => {
  return sanitizeDocument<ExperienceAuthZEntity>(
    doc,
    ability,
    AbilityAction.Read,
    ExperienceAuthZEntity,
    caslFieldOptions
  );
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ExperienceAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, ExperienceAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read experiences.`);
  }

  // Reading someone else's history is only allowed while their profile is.
  await assertProfileScopedListAccess(req.session, req.query.jobProfileId);

  const filter = new MongoQuery(req.query, {
    searchFields: ["company", "jobTitle", "description"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), experienceRoleScopedSecurityQuery(ability)],
  };

  const results = await experienceService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<ExperienceAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    ExperienceAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Experiences retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "experiences",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ExperienceAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const experience = await experienceService.getOne({ query: { _id: req.params.id } });

  if (!experience || !ability.can(AbilityAction.Read, new ExperienceAuthZEntity(experience))) {
    throw new UnauthorizedException("You do not have permission to view this experience record.");
  }

  if (String(experience.jobProfileId) !== req.session.jobProfileId) {
    await assertCanReadJobProfile(req.session, String(experience.jobProfileId));
  }

  return new ApiResponse({
    message: "Experience retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedExperienceResponse(experience, ability),
    fieldName: "experience",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ExperienceAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, ExperienceAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create experience records.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Create, new ExperienceAuthZEntity(req.body));

  const experience = await experienceService.create({
    ...req.body,
    userId: req.session.user?._id,
  });

  return new ApiResponse({
    message: "Experience created successfully.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedExperienceResponse(experience, ability),
    fieldName: "experience",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ExperienceAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingExperience = await experienceService.getOne({ query: { _id: req.params.id } });
  if (!existingExperience) throw new NotFoundException("Experience not found");

  const authZEntity = new ExperienceAuthZEntity(existingExperience);

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to update this experience record.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const experience = await experienceService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Experience updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedExperienceResponse(experience, ability),
    fieldName: "experience",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ExperienceAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingExperience = await experienceService.getOne({ query: { _id: req.params.id } });

  if (!existingExperience || !ability.can(AbilityAction.SoftDelete, new ExperienceAuthZEntity(existingExperience))) {
    throw new UnauthorizedException("You do not have permission to delete this experience record.");
  }

  const experience = await experienceService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Experience moved to trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedExperienceResponse(experience, ability),
    fieldName: "experience",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ExperienceAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingExperience = await experienceService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingExperience || !ability.can(AbilityAction.HardDelete, new ExperienceAuthZEntity(existingExperience))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this experience record.");
  }

  const experience = await experienceService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Experience permanently deleted successfully.",
    statusCode: StatusCodes.OK,
    data: getSanitizedExperienceResponse(experience, ability),
    fieldName: "experience",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ExperienceAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingExperience = await experienceService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingExperience || !ability.can(AbilityAction.Restore, new ExperienceAuthZEntity(existingExperience))) {
    throw new UnauthorizedException("You do not have permission to restore this experience record.");
  }

  const result = await experienceService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Experience restored successfully.",
    statusCode: StatusCodes.OK,
    data: getSanitizedExperienceResponse(result, ability),
    fieldName: "experience",
  });
};
