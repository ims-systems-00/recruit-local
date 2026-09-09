import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams, UnauthorizedException } from "../../../common/helper";
import { PostAbilityBuilder, PostAuthZEntity, ALL_POST_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { postListQuerySpec, postRoleScopedSecurityQuery } from "./post.query";
import { runCursorList } from "../../../common/query";
import { profilePostKey, tenantPostKey, readPostFeedIds } from "./feed.service";
import { toPostResponse, toPostResponseList } from "./post.dto";
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
    data: toPostResponse(getSanitizedResponse(post, ability)),
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
    data: toPostResponse(getSanitizedResponse(post, ability)),
    fieldName: "post",
  });
};

export const list = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  if (!ability.can(AbilityAction.Read, PostAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read posts.");
  }

  // `matched` opts a viewer into feed-based results; it switches modes rather
  // than filters, so the builder never sees it.
  const { matched } = req.query;

  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: postListQuerySpec,
    securityQuery: postRoleScopedSecurityQuery(ability),

    prepare: async () => {
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

      return {
        // Stale/draft posts in the feed fall out via the security + soft-delete
        // filters, so no per-mutation feed invalidation is needed.
        extraConditions: feedIds.length ? [{ _id: { $in: feedIds } }] : [],
        guardExtras: { matched: Boolean(feedIds.length) },
      };
    },

    // Session context drives the per-viewer `alreadyReacted` / `alreadySaved` flags.
    fetch: ({ query, options, offset }) =>
      postService.list({
        query,
        options,
        offset,
        tenantId: req.session?.tenantId,
        jobProfileId: req.session?.jobProfileId,
      }),

    count: ({ query }) => postService.count({ query }),
  });

  // After the cursor is built: field stripping can drop the field it keys on.
  const sanitizedDocs = sanitizeDocuments<PostAuthZEntity>(
    docs,
    ability,
    AbilityAction.Read,
    PostAuthZEntity,
    caslFieldOptions
  );

  return new ApiResponse({
    message: "Posts retrieved",
    statusCode: StatusCodes.OK,
    data: toPostResponseList(sanitizedDocs),
    fieldName: "posts",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const ability = new PostAbilityBuilder(req.session).getAbility();

  // Session context drives the per-viewer `alreadyReacted` / `alreadySaved` flags.
  const post = await postService.getOne({
    query: { _id: req.params.id },
    tenantId: req.session?.tenantId,
    jobProfileId: req.session?.jobProfileId,
  });

  if (!post || !ability.can(AbilityAction.Read, new PostAuthZEntity(post))) {
    throw new UnauthorizedException("You do not have permission to view this post.");
  }

  return new ApiResponse({
    message: "Post retrieved.",
    statusCode: StatusCodes.OK,
    data: toPostResponse(getSanitizedResponse(post, ability)),
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
    data: toPostResponse(getSanitizedResponse(post, ability)),
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
    data: toPostResponse(getSanitizedResponse(post, ability)),
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
    data: toPostResponse(getSanitizedResponse(post, ability)),
    fieldName: "post",
  });
};
