import { PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IUserInterestSurveyDoc, UserInterestSurvey } from "../../../models/user-interest-survey.model";
import { UserInterestSurveyAbilityBuilder, UserInterestSurveyAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";

export const userInterestSurveyProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IUserInterestSurveyDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(UserInterestSurvey.schema.paths, fieldsToExclude));
  return projectQuery(selectedFields);
};

export const surveyRoleScopedSecurityQuery = (
  ability: ReturnType<UserInterestSurveyAbilityBuilder["getAbility"]>
) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(UserInterestSurveyAuthZEntity);
};
