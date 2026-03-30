import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { JobProfile, IJobProfileDoc } from "../../../models";
import { accessibleBy } from "@casl/mongoose";
import { JobProfileAbilityBuilder, JobProfileAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";

export const jobProfileRoleScopedSecurityQuery = (ability: ReturnType<JobProfileAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(JobProfileAuthZEntity);
  return query;
};

export const jobProfileProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IJobProfileDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(JobProfile.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};
