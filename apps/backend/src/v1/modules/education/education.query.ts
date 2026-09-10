import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { EducationAbilityBuilder, EducationAuthZEntity } from "@rl/authz";
import { dateRange, eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { IEducationDoc, Education } from "../../../models";

export const educationProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IEducationDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Education.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

export const educationRoleScopedSecurityQuery = (ability: ReturnType<EducationAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(EducationAuthZEntity);
  return query;
};

/**
 * `jobProfileId` is a filter, not the security boundary — `educationRoleScopedSecurityQuery`
 * is, and `assertProfileScopedListAccess` gates whose profile may be asked for.
 * Anything not listed here never reaches `$match`.
 */
export const educationListQuerySpec: ListQuerySpec = {
  filters: {
    jobProfileId: eq("jobProfileId"),
    fieldOfStudy: eq("fieldOfStudy"),
    startDate: dateRange("startDate"),
  },
  sortable: ["createdAt", "startDate", "endDate"],
  defaultSort: "-startDate",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["degree", "institution", "fieldOfStudy"],
};
