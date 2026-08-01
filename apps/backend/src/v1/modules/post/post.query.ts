import { PipelineStage } from "mongoose";
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

export const postProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IPostDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Post.schema.paths, fieldsToExclude));
  // The populated creator is not a schema path, so keep it in the projection.
  // The lookups it is built from are left out, which drops them from the result.
  selectedFields.push("creator");

  return projectQuery(selectedFields);
};
