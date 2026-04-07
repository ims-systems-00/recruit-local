import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IJobDoc, Job } from "../../../models";
import { JobAbilityBuilder, JobAuthZEntity } from "@rl/authz";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";

export const jobRoleScopedSecurityQuery = (ability: ReturnType<JobAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(JobAuthZEntity);
  return query;
};

export const jobProjectionQuery = (allowedFields?: string[]): PipelineStage[] => {
  let selectedFields: string[] = [];

  if (allowedFields && allowedFields.length > 0) {
    selectedFields = [...allowedFields];
  } else {
    const fieldsToExclude: (keyof IJobDoc | "__v")[] = ["__v"];
    selectedFields = Object.keys(omit(Job.schema.paths, fieldsToExclude));
  }

  return projectQuery(selectedFields);
};
