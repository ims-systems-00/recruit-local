import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { ICVDoc, CV } from "../../../models";
import { CvAbilityBuilder, CvAuthZEntity } from "@rl/authz";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";

export const cvProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ICVDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(CV.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};

export const cvRoleScopedSecurityQuery = (ability: ReturnType<CvAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(CvAuthZEntity);
  return query;
};
