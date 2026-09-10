import { PipelineStage } from "mongoose";
import { ListQuerySpec, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IJobTitleDoc, JobTitle } from "../../../models";

export const jobTitleProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IJobTitleDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(JobTitle.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * `isActive` is not a filter here — the controller pins it, because this endpoint
 * only ever serves the active catalog. Anything not listed below never reaches
 * `$match`; `listQuerySchema` is what turns an unknown key into a 400.
 */
export const jobTitleListQuerySpec: ListQuerySpec = {
  filters: {},
  sortable: ["createdAt", "name", "updatedAt"],
  defaultSort: "createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["name", "description"],
};
