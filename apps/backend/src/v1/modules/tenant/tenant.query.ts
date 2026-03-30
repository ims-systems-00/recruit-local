import { accessibleBy } from "@casl/mongoose";
import { TenantAbilityBuilder, TenantAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { ITenantDoc, Tenant } from "../../../models";

export const tenantRoleScopedSecurityQuery = (ability: ReturnType<TenantAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(TenantAuthZEntity);
  return query;
};

export const tenantProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ITenantDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Tenant.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
