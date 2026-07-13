import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { accessibleBy } from "@casl/mongoose";
import { PostAbilityBuilder, PostAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { Post, IPostDoc } from "../../../models";

// Mongo filter that scopes a list to the posts the caller may read (own tenant's
// posts for employers, LIVE posts for everyone else).
export const postRoleScopedSecurityQuery = (ability: ReturnType<PostAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(PostAuthZEntity);
};

export const postProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IPostDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Post.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
