import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import { SkillAbilityBuilder, SkillAuthZEntity, ALL_SKILL_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import * as skillService from "./skill.service";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { skillRoleScopedSecurityQuery } from "./skill.query";
import { assertCanReadJobProfile, assertProfileScopedListAccess } from "../job-profile/job-profile.access";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_SKILL_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single skill document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedSkillResponse = (doc: any, ability: any) => {
  return sanitizeDocument<SkillAuthZEntity>(doc, ability, AbilityAction.Read, SkillAuthZEntity, caslFieldOptions);
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new SkillAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, SkillAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read skills.`);
  }

  // Reading someone else's skills is only allowed while their profile is.
  await assertProfileScopedListAccess(req.session, req.query.jobProfileId);

  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), skillRoleScopedSecurityQuery(ability)],
  };

  const results = await skillService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<SkillAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    SkillAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Skills retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "skills",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new SkillAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const skill = await skillService.getOne({ query: { _id: req.params.id } });

  if (!skill || !ability.can(AbilityAction.Read, new SkillAuthZEntity(skill))) {
    throw new UnauthorizedException("You do not have permission to view this skill.");
  }

  if (String(skill.jobProfileId) !== req.session.jobProfileId) {
    await assertCanReadJobProfile(req.session, String(skill.jobProfileId));
  }

  return new ApiResponse({
    message: "Skill retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillResponse(skill, ability),
    fieldName: "skill",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new SkillAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, SkillAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create skills.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Create, new SkillAuthZEntity(req.body));

  const skill = await skillService.create({
    ...req.body,
    userId: req.session.user?._id,
  });

  return new ApiResponse({
    message: "Skill created.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedSkillResponse(skill, ability),
    fieldName: "skill",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new SkillAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingSkill = await skillService.getOne({ query: { _id: req.params.id } });
  if (!existingSkill) throw new NotFoundException("Skill not found");

  const authZEntity = new SkillAuthZEntity(existingSkill);

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to update this skill.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const skill = await skillService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Skill updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillResponse(skill, ability),
    fieldName: "skill",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new SkillAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingSkill = await skillService.getOne({ query: { _id: req.params.id } });

  if (!existingSkill || !ability.can(AbilityAction.SoftDelete, new SkillAuthZEntity(existingSkill))) {
    throw new UnauthorizedException("You do not have permission to delete this skill.");
  }

  const skill = await skillService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Skill moved to trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillResponse(skill, ability),
    fieldName: "skill",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new SkillAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingSkill = await skillService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingSkill || !ability.can(AbilityAction.HardDelete, new SkillAuthZEntity(existingSkill))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this skill.");
  }

  const skill = await skillService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Skill permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillResponse(skill, ability),
    fieldName: "skill",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new SkillAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingSkill = await skillService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingSkill || !ability.can(AbilityAction.Restore, new SkillAuthZEntity(existingSkill))) {
    throw new UnauthorizedException("You do not have permission to restore this skill.");
  }

  const skill = await skillService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Skill restored from trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillResponse(skill, ability),
    fieldName: "skill",
  });
};
