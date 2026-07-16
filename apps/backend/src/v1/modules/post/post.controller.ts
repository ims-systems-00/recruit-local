import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { PostAbilityBuilder, PostAuthZEntity, ALL_POST_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { postRoleScopedSecurityQuery } from "./post.query";
import { profilePostKey, tenantPostKey, readPostFeedIds } from "./feed.service";
import { enqueueProfilePostFeedRebuild, enqueueTenantPostFeedRebuild } from "../../../queue/postFeedRebuildQueue";
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

  // `matched` opts a viewer into feed-based results; it is not a real filter
  // field, so strip it before building the Mongo query.
  const { matched, ...restQuery } = req.query;

  const filter = new MongoQuery(restQuery, {
    searchFields: ["title", "text"],
  }).build();

  // Narrow to the viewer's matched-posts feed. Seekers read the profile feed,
  // employers the tenant feed. A cold/evicted feed is rebuilt in the background;
  // this request still lists over the full collection (correct, just unranked).
  // ponytail: no matchScore sort like jobs — feed narrows the set, default
  // createdAt sort applies (matched posts, newest first). Add a $setIntersection
  // score stage in post.service.list if ranked order is needed.
  let feedIds: string[] = [];
  if (matched) {
    const { tenantId, jobProfileId } = req.session ?? {};
    if (jobProfileId) {
      feedIds = await readPostFeedIds(profilePostKey(jobProfileId));
      if (!feedIds.length) await enqueueProfilePostFeedRebuild(jobProfileId);
    } else if (tenantId) {
      feedIds = await readPostFeedIds(tenantPostKey(tenantId));
      if (!feedIds.length) await enqueueTenantPostFeedRebuild(tenantId);
    }
  }

  const finalQuery = {
    $and: [
      filter.getFilterQuery(),
      postRoleScopedSecurityQuery(ability),
      // Stale/draft posts in the feed fall out via the security + soft-delete
      // filters, so no per-mutation feed invalidation is needed.
      ...(feedIds.length ? [{ _id: { $in: feedIds } }] : []),
    ],
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
