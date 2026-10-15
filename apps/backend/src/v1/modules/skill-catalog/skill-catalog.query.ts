import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { SkillCatalogAbilityBuilder, SkillCatalogAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { omit } from "lodash";
import { bool, ListQuerySpec, projectQuery, regexSearch } from "../../../common/query";
import { ISkillCatalogDoc, SkillCatalog, normalizeSkillName } from "../../../models";

/** `{}` for a platform admin; `isActive: true` for everyone else. See `SkillCatalogAbilityBuilder`. */
export const skillCatalogRoleScopedSecurityQuery = (ability: ReturnType<SkillCatalogAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(SkillCatalogAuthZEntity);
  return query;
};

export const skillCatalogProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ISkillCatalogDoc | "__v")[] = ["__v", "normalizedName"];
  const selectedFields = Object.keys(omit(SkillCatalog.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * `clientSearch` matches `normalizedName`, with the term normalised the same way,
 * so neither case nor spacing decides a hit: "manual  HANDLING" finds "Manual
 * handling". It sits under `filters` rather than `searchFields` because the term
 * has to be normalised first; the cursor guard covers filters all the same.
 *
 * Anything not listed here never reaches `$match`.
 */
export const skillCatalogListQuerySpec: ListQuerySpec = {
  filters: {
    isActive: bool("isActive"),
    clientSearch: (value, query) => regexSearch(["normalizedName"])(normalizeSkillName(String(value ?? "")), query),
  },
  sortable: ["name", "createdAt", "updatedAt"],
  defaultSort: "name",
};
