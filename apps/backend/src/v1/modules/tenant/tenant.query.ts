import { accessibleBy } from "@casl/mongoose";
import { TenantAbilityBuilder, TenantAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { PipelineStage } from "mongoose";
import { excludeDeletedQuery, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { ITenantDoc, Tenant, Value } from "../../../models";
import { valueProjectQuery } from "../value/value.query";

export const tenantRoleScopedSecurityQuery = (ability: ReturnType<TenantAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(TenantAuthZEntity);
  return query;
};

export const tenantProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ITenantDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Tenant.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * Replaces the tenant's `values` array of ObjectIds with the populated, non-deleted
 * value documents. Reusable across tenant read pipelines (get/list).
 */
export const populateValuesQuery = (): PipelineStage[] => {
  return [
    {
      $lookup: {
        from: Value.collection.name,
        localField: "values",
        foreignField: "_id",
        as: "values",
        pipeline: [...excludeDeletedQuery(), ...valueProjectQuery()] as PipelineStage.Lookup["$lookup"]["pipeline"],
      },
    },
  ];
};
