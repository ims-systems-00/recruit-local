import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { PostAbilityBuilder, PostAuthZEntity, ALL_POST_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { postRoleScopedSecurityQuery } from "./post.query";
import * as postService from "./post.service";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_POST_FIELDS,
};

// Strip fields the caller isn't permitted to read from a single post document.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedResponse = (doc: any, ability: any) =>
  sanitizeDocument<PostAuthZEntity>(doc, ability, AbilityAction.Read, PostAuthZEntity, caslFieldOptions);

export const create = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Create, PostAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create a post.");
  }

  // A post is owned by the session's tenant and/or job profile — at least one is required.
  const { tenantId, jobProfileId } = req.session ?? {};
  if (!tenantId && !jobProfileId) {
    throw new UnauthorizedException("A tenant or job profile context is required to create a post.");
  }

  // Field-level check: reject body fields this role may not set.
  validateUpdatePayload(req.body, ability, AbilityAction.Create, new PostAuthZEntity(req.body));

  const post = await postService.create({
    payload: { ...req.body, tenantId, jobProfileId },
  });

  return new ApiResponse({
    message: "Post created.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedResponse(post, ability),
    fieldName: "post",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  const existingPost = await postService.getOne({ query: { _id: req.params.id } });

  if (!existingPost || !ability.can(AbilityAction.Update, new PostAuthZEntity(existingPost))) {
    throw new UnauthorizedException("You do not have permission to update this post.");
  }

  // Field-level payload validation.
  validateUpdatePayload(req.body, ability, AbilityAction.Update, new PostAuthZEntity(existingPost));

  const post = await postService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Post updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(post, ability),
    fieldName: "post",
  });
};

export const list = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Read, PostAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read posts.");
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "text"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), postRoleScopedSecurityQuery(ability)],
  };

  const results = await postService.list({ query: finalQuery, options: filter.getQueryOptions() });

  const sanitizedDocs = sanitizeDocuments<PostAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    PostAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Posts retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "posts",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  const post = await postService.getOne({ query: { _id: req.params.id } });

  if (!post || !ability.can(AbilityAction.Read, new PostAuthZEntity(post))) {
    throw new UnauthorizedException("You do not have permission to view this post.");
  }

  return new ApiResponse({
    message: "Post retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(post, ability),
    fieldName: "post",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  const existingPost = await postService.getOne({ query: { _id: req.params.id } });

  if (!existingPost || !ability.can(AbilityAction.SoftDelete, new PostAuthZEntity(existingPost))) {
    throw new UnauthorizedException("You do not have permission to move this post to trash.");
  }

  const post = await postService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Post moved to trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(post, ability),
    fieldName: "post",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  const existingPost = await postService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingPost || !ability.can(AbilityAction.Restore, new PostAuthZEntity(existingPost))) {
    throw new UnauthorizedException("You do not have permission to restore this post.");
  }

  const post = await postService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Post restored from trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(post, ability),
    fieldName: "post",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  const existingPost = await postService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingPost || !ability.can(AbilityAction.HardDelete, new PostAuthZEntity(existingPost))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this post.");
  }

  const post = await postService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Post permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(post, ability),
    fieldName: "post",
  });
};
