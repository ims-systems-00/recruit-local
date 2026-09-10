import { PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { bool, eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IUserInterestSurveyDoc, UserInterestSurvey } from "../../../models/user-interest-survey.model";
import { UserInterestSurveyAbilityBuilder, UserInterestSurveyAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";

export const userInterestSurveyProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IUserInterestSurveyDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(UserInterestSurvey.schema.paths, fieldsToExclude));
  return projectQuery(selectedFields);
};

export const surveyRoleScopedSecurityQuery = (ability: ReturnType<UserInterestSurveyAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(UserInterestSurveyAuthZEntity);
};

/**
 * `userId` is a filter, not the security boundary — `surveyRoleScopedSecurityQuery`
 * is. Anything not listed here never reaches `$match`.
 */
export const surveyListQuerySpec: ListQuerySpec = {
  filters: { userId: eq("userId"), isSkipped: bool("isSkipped") },
  sortable: ["createdAt", "updatedAt"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["interest"],
};
