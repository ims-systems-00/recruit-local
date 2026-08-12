import { Types } from "mongoose";
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
import { PromptAbilityBuilder, PromptAuthZEntity, ALL_PROMPT_FIELDS } from "@rl/authz";
import { AbilityAction, PromptResolutionDto } from "@rl/types";
import * as promptService from "./prompt.service";
import { promptRoleScopedSecurityQuery } from "./prompt.query";
import { toPromptResponse, toPromptResponseList } from "./prompt.dto";
import { renderPrompt } from "./prompt.render";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_PROMPT_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single prompt document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedPromptResponse = (doc: any, ability: any) => {
  return sanitizeDocument<PromptAuthZEntity>(doc, ability, AbilityAction.Read, PromptAuthZEntity, caslFieldOptions);
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, PromptAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read prompts.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "content", "commitMessage"],
  }).build();

  const options = filter.getQueryOptions();
  // Newest version of a name first — the order anyone reading a prompt's
  // history actually wants.
  if (!options.sort) options.sort = "name -version";

  const finalQuery = {
    $and: [filter.getFilterQuery(), promptRoleScopedSecurityQuery(ability)],
  };

  const results = await promptService.list({ query: finalQuery, options });

  const sanitizedDocs = sanitizeDocuments<PromptAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    PromptAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Prompts retrieved",
    statusCode: StatusCodes.OK,
    data: toPromptResponseList(data),
    fieldName: "prompts",
    pagination,
  });
};

/**
 * The registry view: one row per prompt name with the version each of its
 * labels points at. Not sanitized field-by-field because it returns an
 * aggregate rather than documents — the gate above is the whole check.
 */
export const listNames = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, PromptAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read prompts.`);
  }

  const names = await promptService.listNames();

  return new ApiResponse({
    message: "Prompt names retrieved",
    statusCode: StatusCodes.OK,
    data: names,
    fieldName: "promptNames",
  });
};

/**
 * Previews what a name + label resolves to right now.
 *
 * Unlike the runtime resolver this does *not* fall back to a hardcoded default:
 * an admin asking what is stored needs to be told when the answer is "nothing",
 * not handed the constant that would paper over it.
 */
export const resolve = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, PromptAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read prompts.`);
  }

  const { name, label, variables } = req.query as {
    name: string;
    label?: string;
    variables?: Record<string, string>;
  };

  const found = await promptService.findForResolution({ name, label });
  if (!found) throw new NotFoundException(`No stored version of "${name}" resolves for label "${label ?? "default"}".`);

  const resolution: PromptResolutionDto = {
    name,
    version: found.prompt.version,
    label: found.label,
    content: renderPrompt(found.prompt.content, variables),
    fallback: false,
  };

  return new ApiResponse({
    message: "Prompt resolved.",
    statusCode: StatusCodes.OK,
    data: resolution,
    fieldName: "prompt",
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const prompt = await promptService.getOne({ query: { _id: req.params.id } });

  if (!prompt || !ability.can(AbilityAction.Read, new PromptAuthZEntity(prompt))) {
    throw new UnauthorizedException("You do not have permission to view this prompt.");
  }

  return new ApiResponse({
    message: "Prompt retrieved.",
    statusCode: StatusCodes.OK,
    data: toPromptResponse(getSanitizedPromptResponse(prompt, ability)),
    fieldName: "prompt",
  });
};

/**
 * Creates the next version of a prompt. There is no "edit content" route —
 * every content change appends, which is what makes the history complete and
 * rollback a label move.
 */
export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, PromptAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create prompts.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Create, new PromptAuthZEntity(req.body));

  const prompt = await promptService.create({
    payload: {
      ...req.body,
      createdBy: req.session.user?._id ? new Types.ObjectId(req.session.user._id) : undefined,
    },
  });

  return new ApiResponse({
    message: `Prompt "${prompt.name}" version ${prompt.version} created.`,
    statusCode: StatusCodes.CREATED,
    data: toPromptResponse(getSanitizedPromptResponse(prompt, ability)),
    fieldName: "prompt",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existing = await promptService.getOne({ query: { _id: req.params.id } });
  if (!existing) throw new NotFoundException("Prompt not found");

  const authZEntity = new PromptAuthZEntity(existing);

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("You are not authorized to update this prompt.");
  }

  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const prompt = await promptService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Prompt updated.",
    statusCode: StatusCodes.OK,
    data: toPromptResponse(getSanitizedPromptResponse(prompt, ability)),
    fieldName: "prompt",
  });
};

/**
 * Publish, and equally rollback: both are "point this label at that version".
 */
export const setLabel = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Update, PromptAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to label prompts.");
  }

  const prompt = await promptService.setLabel({
    name: req.params.name,
    label: req.params.label,
    version: Number(req.body.version),
  });

  return new ApiResponse({
    message: `Label "${req.params.label}" now points at version ${req.body.version}.`,
    statusCode: StatusCodes.OK,
    data: toPromptResponse(getSanitizedPromptResponse(prompt, ability)),
    fieldName: "prompt",
  });
};

export const removeLabel = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Update, PromptAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to label prompts.");
  }

  const result = await promptService.removeLabel({
    name: req.params.name,
    label: req.params.label,
  });

  return new ApiResponse({
    message: `Label "${req.params.label}" removed from "${req.params.name}".`,
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "result",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existing = await promptService.getOne({ query: { _id: req.params.id } });

  if (!existing || !ability.can(AbilityAction.Delete, new PromptAuthZEntity(existing))) {
    throw new UnauthorizedException("You do not have permission to delete this prompt.");
  }

  const result = await promptService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Prompt moved to trash.",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "result",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existing = await promptService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existing || !ability.can(AbilityAction.Update, new PromptAuthZEntity(existing))) {
    throw new UnauthorizedException("You do not have permission to restore this prompt.");
  }

  const result = await promptService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Prompt restored successfully.",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "result",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new PromptAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existing = await promptService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existing || !ability.can(AbilityAction.Delete, new PromptAuthZEntity(existing))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this prompt.");
  }

  const prompt = await promptService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Prompt permanently deleted.",
    statusCode: StatusCodes.OK,
    data: toPromptResponse(getSanitizedPromptResponse(prompt, ability)),
    fieldName: "prompt",
  });
};
