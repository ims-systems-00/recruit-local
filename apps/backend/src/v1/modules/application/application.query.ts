import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { IApplicationDoc, Application } from "../../../models";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "../../../types/ability";
import { ApplicationAbilityBuilder, ApplicationAuthZEntity } from "../../../../../../packages/authz/dist/cjs";

// event queries
export const applicationProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IApplicationDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Application.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

export const applicationRoleScopedSecurityQuery = (ability: ReturnType<ApplicationAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(ApplicationAuthZEntity);
  return query;
};
