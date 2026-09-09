import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { InterestAbilityBuilder, InterestAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IInterestDoc, Interest } from "../../../models";

export const interestRoleScopedSecurityQuery = (ability: ReturnType<InterestAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(InterestAuthZEntity);
  return query;
};

export const interestProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IInterestDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Interest.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * `jobProfileId` is a filter, not the security boundary — `interestRoleScopedSecurityQuery`
 * is, and `assertProfileScopedListAccess` gates whose profile may be asked for.
 * Anything not listed here never reaches `$match`.
 */
export const interestListQuerySpec: ListQuerySpec = {
  filters: { jobProfileId: eq("jobProfileId") },
  sortable: ["createdAt", "name"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["name", "description"],
};
