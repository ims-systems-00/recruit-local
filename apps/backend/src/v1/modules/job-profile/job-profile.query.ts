import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { JobProfile, IJobProfileDoc } from "../../../models";
import { accessibleBy } from "@casl/mongoose";
import { JobProfileAbilityBuilder, JobProfileAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { modelNames } from "../../../models/constants";

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
  // Populated via `populateJobProfileKycStatusQuery`, not a schema path either.
  selectedFields.push("kycStatus");
  return projectQuery(selectedFields);
};

/**
 * Populates `kycStatus` onto a job profile from its owning User's account-level
 * kycStatus (JobProfile.userId -> User._id). `null` when the owning user can't
 * be resolved.
 */
export const populateJobProfileKycStatusQuery = (): PipelineStage[] => [
  {
    $lookup: {
      from: modelNames.USER,
      localField: "userId",
      foreignField: "_id",
      as: "_kycUser",
      pipeline: [{ $project: { kycStatus: 1 } }],
    },
  },
  {
    $addFields: {
      kycStatus: { $ifNull: [{ $arrayElemAt: ["$_kycUser.kycStatus", 0] }, null] },
    },
  },
  { $project: { _kycUser: 0 } },
];
