import { StatusCodes } from "http-status-codes";
import { SkillCatalogAbilityBuilder, SkillCatalogAuthZEntity, ALL_SKILL_CATALOG_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, UnauthorizedException } from "../../../common/helper";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { runCursorList } from "../../../common/query";
import { skillCatalogListQuerySpec, skillCatalogRoleScopedSecurityQuery } from "./skill-catalog.query";
import * as skillCatalogService from "./skill-catalog.service";

type SkillCatalogAbility = ReturnType<SkillCatalogAbilityBuilder["getAbility"]>;

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_SKILL_CATALOG_FIELDS,
};

const getSanitizedSkillCatalogResponse = (doc: unknown, ability: SkillCatalogAbility) =>
  sanitizeDocument<SkillCatalogAuthZEntity>(
    doc,
    ability,
    AbilityAction.Read,
    SkillCatalogAuthZEntity,
    caslFieldOptions
  );

export const list = async ({ req }: ControllerParams) => {
  const ability = new SkillCatalogAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Read, SkillCatalogAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read the skill catalogue.");
  }

  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: skillCatalogListQuerySpec,
    // Pins everyone but a platform admin to active entries.
    securityQuery: skillCatalogRoleScopedSecurityQuery(ability),
    fetch: ({ query, options, offset }) => skillCatalogService.list({ query, options, offset }),
  });

  // After the cursor is built: field stripping can drop the field it keys on.
  const sanitizedDocs = sanitizeDocuments<SkillCatalogAuthZEntity>(
    docs,
    ability,
    AbilityAction.Read,
    SkillCatalogAuthZEntity,
    caslFieldOptions
  );

  return new ApiResponse({
    message: "Skills retrieved.",
    statusCode: StatusCodes.OK,
    data: sanitizedDocs,
    fieldName: "skills",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const ability = new SkillCatalogAbilityBuilder(req.session).getAbility();

  const skill = await skillCatalogService.getOne({ query: { _id: req.params.id } });

  // Row-level: a deactivated entry is visible to a platform admin only.
  if (!ability.can(AbilityAction.Read, new SkillCatalogAuthZEntity(skill))) {
    throw new UnauthorizedException("You are not authorized to view this skill.");
  }

  return new ApiResponse({
    message: "Skill retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillCatalogResponse(skill, ability),
    fieldName: "skill",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const ability = new SkillCatalogAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Create, SkillCatalogAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to add skills to the catalogue.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Create, new SkillCatalogAuthZEntity(req.body));

  const skill = await skillCatalogService.create(req.body);

  return new ApiResponse({
    message: "Skill created.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedSkillCatalogResponse(skill, ability),
    fieldName: "skill",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new SkillCatalogAbilityBuilder(req.session).getAbility();
  const authZEntity = new SkillCatalogAuthZEntity({ _id: req.params.id });

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("You are not authorized to update this skill.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const skill = await skillCatalogService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Skill updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillCatalogResponse(skill, ability),
    fieldName: "skill",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new SkillCatalogAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.SoftDelete, new SkillCatalogAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to delete this skill.");
  }

  const skill = await skillCatalogService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Skill moved to trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillCatalogResponse(skill, ability),
    fieldName: "skill",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new SkillCatalogAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.HardDelete, new SkillCatalogAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this skill.");
  }

  const skill = await skillCatalogService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Skill permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillCatalogResponse(skill, ability),
    fieldName: "skill",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new SkillCatalogAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Restore, new SkillCatalogAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to restore this skill.");
  }

  const skill = await skillCatalogService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Skill restored from trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedSkillCatalogResponse(skill, ability),
    fieldName: "skill",
  });
};
