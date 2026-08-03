import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { ReactionAbilityBuilder, ReactionAuthZEntity, ALL_REACTION_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { reactionRoleScopedSecurityQuery } from "./reaction.query";
import { toReactionResponse, toReactionResponseList } from "./reaction.dto";
import * as reactionService from "./reaction.service";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_REACTION_FIELDS,
};

// Strip fields the caller isn't permitted to read from a single reaction document.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedResponse = (doc: any, ability: any) =>
  sanitizeDocument<ReactionAuthZEntity>(doc, ability, AbilityAction.Read, ReactionAuthZEntity, caslFieldOptions);

export const create = async ({ req }: ControllerParams) => {
  const ability = new ReactionAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Create, ReactionAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to react.");
  }

  // A reaction is owned by the session's tenant or job profile — at least one is
  // required. A platform admin clears the check above but has no identity to
  // react as, so it stops here.
  const { tenantId, jobProfileId } = req.session ?? {};
  if (!tenantId && !jobProfileId) {
    throw new UnauthorizedException("A tenant or job profile context is required to react.");
  }

  // Field-level check: reject body fields this role may not set.
  validateUpdatePayload(req.body, ability, AbilityAction.Create, new ReactionAuthZEntity(req.body));

  const reaction = await reactionService.create({ ...req.body, tenantId, jobProfileId });

  return new ApiResponse({
    message: "Reaction created.",
    statusCode: StatusCodes.CREATED,
    data: toReactionResponse(getSanitizedResponse(reaction, ability)),
    fieldName: "reaction",
  });
};

export const list = async ({ req }: ControllerParams) => {
  const ability = new ReactionAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Read, ReactionAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read reactions.");
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["type"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), reactionRoleScopedSecurityQuery(ability)],
  };

  const results = await reactionService.list({ query: finalQuery, options: filter.getQueryOptions() });

  const sanitizedDocs = sanitizeDocuments<ReactionAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    ReactionAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Reactions retrieved",
    statusCode: StatusCodes.OK,
    data: toReactionResponseList(data),
    fieldName: "reactions",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const ability = new ReactionAbilityBuilder(req.session).getAbility();

  const reaction = await reactionService.getOne({ query: { _id: req.params.id } });

  if (!reaction || !ability.can(AbilityAction.Read, new ReactionAuthZEntity(reaction))) {
    throw new UnauthorizedException("You do not have permission to view this reaction.");
  }

  return new ApiResponse({
    message: "Reaction retrieved",
    statusCode: StatusCodes.OK,
    data: toReactionResponse(getSanitizedResponse(reaction, ability)),
    fieldName: "reaction",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new ReactionAbilityBuilder(req.session).getAbility();

  const existingReaction = await reactionService.getOne({ query: { _id: req.params.id } });

  if (!existingReaction || !ability.can(AbilityAction.Update, new ReactionAuthZEntity(existingReaction))) {
    throw new UnauthorizedException("You do not have permission to update this reaction.");
  }

  // Field-level payload validation.
  validateUpdatePayload(req.body, ability, AbilityAction.Update, new ReactionAuthZEntity(existingReaction));

  const reaction = await reactionService.update({
    query: { _id: req.params.id },
    update: req.body,
  });

  return new ApiResponse({
    message: "Reaction updated.",
    statusCode: StatusCodes.OK,
    data: toReactionResponse(getSanitizedResponse(reaction, ability)),
    fieldName: "reaction",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new ReactionAbilityBuilder(req.session).getAbility();

  const existingReaction = await reactionService.getOne({ query: { _id: req.params.id } });

  if (!existingReaction || !ability.can(AbilityAction.SoftDelete, new ReactionAuthZEntity(existingReaction))) {
    throw new UnauthorizedException("You do not have permission to move this reaction to trash.");
  }

  const reaction = await reactionService.softRemove({ _id: req.params.id });

  return new ApiResponse({
    message: "Reaction soft deleted.",
    statusCode: StatusCodes.OK,
    data: toReactionResponse(getSanitizedResponse(reaction, ability)),
    fieldName: "reaction",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new ReactionAbilityBuilder(req.session).getAbility();

  const existingReaction = await reactionService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingReaction || !ability.can(AbilityAction.Restore, new ReactionAuthZEntity(existingReaction))) {
    throw new UnauthorizedException("You do not have permission to restore this reaction.");
  }

  const reaction = await reactionService.restore({ _id: req.params.id });

  return new ApiResponse({
    message: "Reaction restored.",
    statusCode: StatusCodes.OK,
    data: toReactionResponse(getSanitizedResponse(reaction, ability)),
    fieldName: "reaction",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new ReactionAbilityBuilder(req.session).getAbility();

  const existingReaction = await reactionService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingReaction || !ability.can(AbilityAction.HardDelete, new ReactionAuthZEntity(existingReaction))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this reaction.");
  }

  const reaction = await reactionService.hardRemove({ _id: req.params.id });

  return new ApiResponse({
    message: "Reaction permanently deleted.",
    statusCode: StatusCodes.OK,
    data: toReactionResponse(getSanitizedResponse(reaction, ability)),
    fieldName: "reaction",
  });
};
