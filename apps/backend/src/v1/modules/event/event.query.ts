import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { PipelineStage } from "mongoose";
import { dateRange, eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { Event, IEventDoc } from "../../../models";
import { omit } from "lodash";

export const roleScopedSecurityQuery = (ability: ReturnType<UserAbilityBuilder["getAbility"]>) => {
  // Get the raw query from CASL
  const query = accessibleBy(ability, AbilityAction.Read).ofType(UserAuthZEntity);
  return query;
};

// event queries
export const eventProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IEventDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Event.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};

/**
 * NOTE: this list has no CASL scoping. `roleScopedSecurityQuery` is defined above
 * but the controller never calls it — that predates this migration and is left
 * as-is rather than silently narrowing what users can see. Anything not listed
 * here never reaches `$match`.
 */
export const eventListQuerySpec: ListQuerySpec = {
  filters: {
    statusId: eq("statusId"),
    type: eq("type"),
    mode: eq("mode"),
    startDate: dateRange("startDate"),
  },
  sortable: ["createdAt", "startDate", "title"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["title", "description", "location"],
};
