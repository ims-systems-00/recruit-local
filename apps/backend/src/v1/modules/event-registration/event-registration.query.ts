import { PipelineStage } from "mongoose";
import { dateRange, eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { EventRegistrationInput, EventRegistration } from "../../../models";

export const eventRegistrationProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof EventRegistrationInput | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(EventRegistration.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};

/**
 * No CASL scoping on this list — unchanged by the migration. `status` was the old
 * `searchField`, but it is an enum, so the regex only ever matched a whole value.
 * Anything not listed here never reaches `$match`.
 */
export const eventRegistrationListQuerySpec: ListQuerySpec = {
  filters: {
    eventId: eq("eventId"),
    userId: eq("userId"),
    statusId: eq("statusId"),
    createdAt: dateRange("createdAt"),
  },
  sortable: ["createdAt", "updatedAt"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["status"],
};
