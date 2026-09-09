import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { IActionDoc, Action } from "../../../models";

// event queries
export const actionProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IActionDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Action.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * `label` was the old `searchField` but Action has no such path, so search never
 * matched anything here. `actionType` is the field that actually exists.
 */
export const actionListQuerySpec: ListQuerySpec = {
  filters: { statusId: eq("statusId"), actionType: eq("actionType") },
  sortable: ["createdAt", "updatedAt", "actionType"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["actionType"],
};
