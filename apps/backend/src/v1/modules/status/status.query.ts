import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { StatusAbilityBuilder, StatusAuthZEntity } from "@rl/authz";
import { eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { IStatusDoc, Status } from "../../../models";

export const statusRoleScopedSecurityQuery = (ability: ReturnType<StatusAbilityBuilder["getAbility"]>) => {
  return accessibleBy(ability, AbilityAction.Read).ofType(StatusAuthZEntity);
};

// event queries
export const statusProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IStatusDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Status.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * `value` was in the old `searchFields` but Status has no such path, so that half
 * of the search never matched. Anything not listed here never reaches `$match`.
 */
export const statusListQuerySpec: ListQuerySpec = {
  filters: {
    collectionName: eq("collectionName"),
    collectionId: eq("collectionId"),
    label: eq("label"),
  },
  sortable: ["createdAt", "weight", "label"],
  defaultSort: "createdAt",
  searchKey: "clientSearch",
  searchFields: ["label"],
};
