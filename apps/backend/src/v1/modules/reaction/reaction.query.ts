import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { accessibleBy } from "@casl/mongoose";
import { ReactionAbilityBuilder, ReactionAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { Reaction, IReactionDoc } from "../../../models";

// Mongo filter that scopes a list to the reactions the caller may read. Reactions
// are public, so this is unrestricted for any signed-in caller; it stays in place
// so a future narrowing of the read rules applies to lists automatically.
export const reactionRoleScopedSecurityQuery = (ability: ReturnType<ReactionAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(ReactionAuthZEntity);
};

export const reactionProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IReactionDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Reaction.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};

/**
 * `reactionRoleScopedSecurityQuery` is the boundary; these only narrow. Anything
 * not listed here never reaches `$match`.
 */
export const reactionListQuerySpec: ListQuerySpec = {
  filters: { collectionName: eq("collectionName"), collectionId: eq("collectionId"), type: eq("type") },
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["type"],
};
