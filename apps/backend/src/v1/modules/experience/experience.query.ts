import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { ExperienceAbilityBuilder, ExperienceAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { bool, dateRange, eq, oneOf, ListQuerySpec, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { Experience, IExperienceDoc } from "../../../models";

export const experienceRoleScopedSecurityQuery = (ability: ReturnType<ExperienceAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(ExperienceAuthZEntity);
  return query;
};

// event queries
export const experienceProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IExperienceDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Experience.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * `jobProfileId` is a filter, not the security boundary — `experienceRoleScopedSecurityQuery`
 * is, and `assertProfileScopedListAccess` gates whose profile may be asked for.
 * Anything not listed here never reaches `$match`.
 */
export const experienceListQuerySpec: ListQuerySpec = {
  filters: {
    jobProfileId: eq("jobProfileId"),
    workplace: oneOf("workplace"),
    employmentType: oneOf("employmentType"),
    isActive: bool("isActive"),
    startDate: dateRange("startDate"),
  },
  sortable: ["createdAt", "startDate", "endDate"],
  defaultSort: "-startDate",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["company", "jobTitle", "description"],
};
