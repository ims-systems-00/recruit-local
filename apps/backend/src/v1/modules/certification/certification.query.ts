import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { CertificationAbilityBuilder, CertificationAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { Certification, ICertificationDoc } from "../../../models";
import { omit } from "lodash";

export const certificationRoleScopedSecurityQuery = (
  ability: ReturnType<CertificationAbilityBuilder["getAbility"]>
) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(CertificationAuthZEntity);
  return query;
};

// certification queries
export const certificationProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ICertificationDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Certification.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
