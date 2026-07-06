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

export const jobProfileProjectQuery = (allowedFields?: string[]): PipelineStage[] => {
  let selectedFields: string[] = [];

  // If allowedFields are provided and not empty, use them
  if (allowedFields && allowedFields.length > 0) {
    selectedFields = [...allowedFields];
  } else {
    const fieldsToExclude: (keyof IJobProfileDoc | "__v")[] = ["__v"];
    selectedFields = Object.keys(omit(JobProfile.schema.paths, fieldsToExclude));
  }
  // Populated FileMedia objects are not schema paths, so keep them in the projection.
  selectedFields.push("profileImage", "coverPhoto");
  return projectQuery(selectedFields);
};
