import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec, objectId, projectQuery } from "../../../common/query";
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

/**
 * `jobProfileRoleScopedSecurityQuery` is the boundary; these only narrow. The
 * catalog refs (`jobTitle`, `industry`, `workMode`) are arrays of ObjectIds, so an
 * equality match on one is Mongo's "array contains" — which is what a filter on
 * them should mean. Anything not listed here never reaches `$match`.
 */
export const jobProfileListQuerySpec: ListQuerySpec = {
  filters: {
    userId: eq("userId"),
    status: eq("status"),
    visibility: eq("visibility"),
    onboardingStep: eq("onboardingStep"),
    // `objectId`, not `eq`: these are ObjectId refs whose keys do not end in `Id`,
    // so `sanitizeQueryIds` — which decides from the key's name — left them as
    // strings and every one of these filters matched nothing. Equality against the
    // array-valued ones is Mongo's "array contains", which is what they should mean.
    experienceLevel: objectId("experienceLevel"),
    jobTitle: objectId("jobTitle"),
    industry: objectId("industry"),
    workMode: objectId("workMode"),
  },
  sortable: ["createdAt", "name"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  // `headline` is not a path on JobProfile — the old search never matched on it.
  searchFields: ["name", "summary"],
};

/**
 * `GET /job-profiles/:id/applied-jobs` returns jobs but pages over the
 * candidate's *applications*, so its query contract is application-shaped. The
 * profile id comes from the route param, not the query string.
 */
export const appliedJobsListQuerySpec: ListQuerySpec = {
  filters: {},
  sortable: ["createdAt"],
  defaultSort: "-createdAt",
};
