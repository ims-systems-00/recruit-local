import { PipelineStage, Types } from "mongoose";
import {
  projectQuery,
  populateFileMediaQuery,
  populateFileMediaListQuery,
  populateTenantSummaryQuery,
  populateJobProfileSummaryQuery,
} from "../../../common/query";
import { omit } from "lodash";
import { accessibleBy } from "@casl/mongoose";
import { PostAbilityBuilder, PostAuthZEntity } from "@rl/authz";
import { AbilityAction, POST_CREATOR_TYPE } from "@rl/types";
import { Post, IPostDoc } from "../../../models";
import { modelNames } from "../../../models/constants";

// Mongo filter that scopes a list to the posts the caller may read (own tenant's
// posts for employers, LIVE posts for everyone else).
export const postRoleScopedSecurityQuery = (ability: ReturnType<PostAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(PostAuthZEntity);
};

/**
 * Replaces the post's `banner` / `images` refs with their populated FileMedia
 * documents (public `src` URL included). Populated in place: the model stores
 * the refs under those same names, so callers read media objects where they
 * previously read ObjectIds. Must run before `postProjectQuery`.
 */
export const populatePostMediaQuery = (): PipelineStage[] => [
  ...populateFileMediaQuery("banner", "banner"),
  ...populateFileMediaListQuery("images", "images"),
];

// Scratch fields the creator lookups land in before they are folded into
// `creator`. Dropped by `postProjectQuery`, which only projects `creator`.
const TENANT_CREATOR_FIELD = "creatorTenant";
const JOB_PROFILE_CREATOR_FIELD = "creatorJobProfile";

/**
 * Adds the post's author as `creator`: a summary of the owning tenant
 * (recruiter) or job profile (seeker), tagged with a `type` discriminator so one
 * client-side author card covers both. The raw `tenantId` / `jobProfileId` refs
 * are left in place.
 *
 * A post is owned by a tenant or a profile, not both; where both refs somehow
 * exist the tenant wins, matching the employer-first ownership the create path
 * enforces. `creator` is `null` when neither ref resolves (unset, or the owner
 * was soft-deleted). Must run before `postProjectQuery`.
 */
export const populatePostCreatorQuery = (): PipelineStage[] => [
  ...populateTenantSummaryQuery("tenantId", TENANT_CREATOR_FIELD),
  ...populateJobProfileSummaryQuery("jobProfileId", JOB_PROFILE_CREATOR_FIELD),
  {
    $addFields: {
      creator: {
        $cond: [
          { $ne: [`$${TENANT_CREATOR_FIELD}`, null] },
          { $mergeObjects: [{ type: POST_CREATOR_TYPE.TENANT }, `$${TENANT_CREATOR_FIELD}`] },
          {
            $cond: [
              { $ne: [`$${JOB_PROFILE_CREATOR_FIELD}`, null] },
              { $mergeObjects: [{ type: POST_CREATOR_TYPE.JOB_PROFILE }, `$${JOB_PROFILE_CREATOR_FIELD}`] },
              null,
            ],
          },
        ],
      },
    },
  },
];

/**
 * Aggregation expression matching the documents owned by the current viewer, or
 * `null` when the caller has no identity to own anything (an unauthenticated
 * reader, or a platform admin, which reacts/saves as nobody).
 *
 * Reactions and favourites are both owned by exactly one context — a job profile
 * (seeker) or a tenant (employer) — so the profile ref wins where a session
 * somehow carries both, matching `alreadysaved` in the job module.
 */
const viewerOwnerCondition = (tenantId?: string, jobProfileId?: string): Record<string, unknown> | null => {
  if (jobProfileId && Types.ObjectId.isValid(jobProfileId)) {
    return { $eq: ["$jobProfileId", new Types.ObjectId(jobProfileId)] };
  }
  if (tenantId && Types.ObjectId.isValid(tenantId)) {
    return { $eq: ["$tenantId", new Types.ObjectId(tenantId)] };
  }
  return null;
};

/**
 * Adds `alreadyReacted`: the viewer's own reaction type on each post, or `null`
 * when they have not reacted. Reactions are soft-deleted, so a removed one is
 * excluded; nothing enforces one reaction per reactor per post, so the most
 * recently touched one wins. Must run after `postProjectQuery`, which would
 * otherwise drop the field (it is not a schema path).
 *
 * Also adds `alreadyReactedId`, the id of that same reaction document, so a
 * client can undo it via `DELETE /reactions/:id/soft` without first looking the
 * reaction up. Because duplicates are possible, it identifies the reaction the
 * `$sort`/`$limit` below picked — not necessarily the viewer's only one.
 */
export const alreadyReactedQuery = (tenantId?: string, jobProfileId?: string): PipelineStage[] => {
  const ownerCondition = viewerOwnerCondition(tenantId, jobProfileId);
  if (!ownerCondition) return [{ $addFields: { alreadyReacted: null, alreadyReactedId: null } }];

  return [
    {
      $lookup: {
        from: modelNames.REACTION,
        let: { currentPostId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  ownerCondition,
                  { $eq: ["$collectionName", modelNames.POST] },
                  { $eq: ["$collectionId", "$$currentPostId"] },
                  { $ne: ["$deleteMarker.status", true] },
                ],
              },
            },
          },
          { $sort: { updatedAt: -1 } },
          { $limit: 1 },
          { $project: { type: 1 } },
        ] as PipelineStage.Lookup["$lookup"]["pipeline"],
        as: "alreadyReactedLookup",
      },
    },
    {
      $addFields: {
        alreadyReacted: { $ifNull: [{ $arrayElemAt: ["$alreadyReactedLookup.type", 0] }, null] },
        alreadyReactedId: { $ifNull: [{ $arrayElemAt: ["$alreadyReactedLookup._id", 0] }, null] },
      },
    },
    { $project: { alreadyReactedLookup: 0 } },
  ];
};

/**
 * Adds `alreadySaved`: whether the viewer has favourited this post. Favourites
 * are soft-deleted, so an un-saved post reads `false`. Must run after
 * `postProjectQuery` for the same reason as `alreadyReactedQuery`.
 *
 * Also adds `alreadySavedId`, the id of that favourite (`null` when unsaved), so
 * a client can undo it via `DELETE /favourites/:id/soft` without looking it up.
 * A partial unique index on the model keeps at most one live favourite per
 * viewer per item, so this is unambiguous.
 */
export const alreadySavedQuery = (tenantId?: string, jobProfileId?: string): PipelineStage[] => {
  const ownerCondition = viewerOwnerCondition(tenantId, jobProfileId);
  if (!ownerCondition) return [{ $addFields: { alreadySaved: false, alreadySavedId: null } }];

  return [
    {
      $lookup: {
        from: modelNames.FAVOURITE,
        let: { currentPostId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  ownerCondition,
                  { $eq: ["$itemType", modelNames.POST] },
                  { $eq: ["$itemId", "$$currentPostId"] },
                  { $ne: ["$deleteMarker.status", true] },
                ],
              },
            },
          },
          { $limit: 1 },
          { $project: { _id: 1 } },
        ] as PipelineStage.Lookup["$lookup"]["pipeline"],
        as: "alreadySavedLookup",
      },
    },
    {
      $addFields: {
        alreadySaved: { $gt: [{ $size: "$alreadySavedLookup" }, 0] },
        alreadySavedId: { $ifNull: [{ $arrayElemAt: ["$alreadySavedLookup._id", 0] }, null] },
      },
    },
    { $project: { alreadySavedLookup: 0 } },
  ];
};

/**
 * Adds `reactionCount`: the total number of (non-deleted) reactions on the
 * post, across every reactor and reaction type. Unlike `alreadyReactedQuery`
 * this is viewer-independent — same value for every caller. Must run after
 * `postProjectQuery`, which would otherwise drop the field (it is not a schema
 * path).
 */
export const reactionCountQuery = (): PipelineStage[] => [
  {
    $lookup: {
      from: modelNames.REACTION,
      let: { currentPostId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$collectionName", modelNames.POST] },
                { $eq: ["$collectionId", "$$currentPostId"] },
                { $ne: ["$deleteMarker.status", true] },
              ],
            },
          },
        },
        { $count: "count" },
      ] as PipelineStage.Lookup["$lookup"]["pipeline"],
      as: "reactionCountLookup",
    },
  },
  {
    $addFields: {
      reactionCount: { $ifNull: [{ $arrayElemAt: ["$reactionCountLookup.count", 0] }, 0] },
    },
  },
  { $project: { reactionCountLookup: 0 } },
];

export const postProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IPostDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Post.schema.paths, fieldsToExclude));
  // The populated creator is not a schema path, so keep it in the projection.
  // The lookups it is built from are left out, which drops them from the result.
  selectedFields.push("creator");

  return projectQuery(selectedFields);
};
