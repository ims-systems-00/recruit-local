import { accessibleBy } from "@casl/mongoose";
import { TenantAbilityBuilder, TenantAuthZEntity } from "@rl/authz";
import { AbilityAction, USER_ROLE_ENUMS } from "@rl/types";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { ITenantDoc, Tenant } from "../../../models";
import { modelNames } from "../../../models/constants";

export const tenantRoleScopedSecurityQuery = (ability: ReturnType<TenantAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(TenantAuthZEntity);
  return query;
};

export const tenantProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ITenantDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Tenant.schema.paths, fieldsToExclude));
  // Populated FileMedia objects are not schema paths, so keep them in the projection.
  selectedFields.push("profileImage", "coverPhoto");
  // Populated via `populateTenantKycStatusQuery`, not a schema path either.
  selectedFields.push("kycStatus");

  return projectQuery(selectedFields);
};

/**
 * Populates `kycStatus` onto a tenant from its primary admin — the tenant model
 * has no owner/userId of its own, so this looks up the earliest-created User with
 * { tenantId: this tenant, role: ADMIN } and surfaces that user's account-level
 * kycStatus. `null` when the org has no admin user yet.
 */
export const populateTenantKycStatusQuery = (): PipelineStage[] => [
  {
    $lookup: {
      from: modelNames.USER,
      let: { tenantId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $and: [{ $eq: ["$tenantId", "$$tenantId"] }, { $eq: ["$role", USER_ROLE_ENUMS.ADMIN] }] },
          },
        },
        { $sort: { createdAt: 1 } },
        { $limit: 1 },
        { $project: { kycStatus: 1 } },
      ],
      as: "_kycAdmin",
    },
  },
  {
    $addFields: {
      kycStatus: { $ifNull: [{ $arrayElemAt: ["$_kycAdmin.kycStatus", 0] }, null] },
    },
  },
  { $project: { _kycAdmin: 0 } },
];
