import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { ExperienceAbilityBuilder, ExperienceAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
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
