import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { SkillAbilityBuilder, SkillAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
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
