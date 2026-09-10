import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { CertificationAbilityBuilder, CertificationAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { dateRange, eq, ListQuerySpec, projectQuery } from "../../../common/query";
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

/**
 * `jobProfileId` is a filter, not the security boundary — `certificationRoleScopedSecurityQuery`
 * is, and `assertProfileScopedListAccess` gates whose profile may be asked for.
 * Anything not listed here never reaches `$match`.
 */
export const certificationListQuerySpec: ListQuerySpec = {
  filters: {
    jobProfileId: eq("jobProfileId"),
    issuingOrganization: eq("issuingOrganization"),
    issueDate: dateRange("issueDate"),
  },
  sortable: ["createdAt", "issueDate", "title"],
  defaultSort: "-issueDate",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["title", "issuingOrganization"],
};
