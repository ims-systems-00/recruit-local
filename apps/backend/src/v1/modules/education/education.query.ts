import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { EducationAbilityBuilder, EducationAuthZEntity } from "@rl/authz";
import { projectQuery } from "../../../common/query";
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
