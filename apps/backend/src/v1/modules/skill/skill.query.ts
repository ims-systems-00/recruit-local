import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { SkillAbilityBuilder, SkillAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { ISkillDoc, Skill } from "../../../models";

export const skillRoleScopedSecurityQuery = (ability: ReturnType<SkillAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(SkillAuthZEntity);
  return query;
};

export const skillProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ISkillDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Skill.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * `jobProfileId` is a filter, not the security boundary — `skillRoleScopedSecurityQuery`
 * is, and `assertProfileScopedListAccess` gates whose profile may be asked for.
 * Anything not listed here never reaches `$match`.
 */
export const skillListQuerySpec: ListQuerySpec = {
  filters: { jobProfileId: eq("jobProfileId"), proficiencyLevel: eq("proficiencyLevel") },
  sortable: ["createdAt", "name"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["name", "description"],
};
