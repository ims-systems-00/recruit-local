import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec, projectQuery, range } from "../../../common/query";
import { omit } from "lodash";
import { ISalaryDoc, Salary } from "../../../models";

export const salaryProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ISalaryDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Salary.schema.paths, fieldsToExclude));
  return projectQuery(selectedFields);
};

/**
 * Public list — no session, no CASL. Anything not listed here never reaches
 * `$match`.
 */
export const salaryListQuerySpec: ListQuerySpec = {
  filters: {
    jobTitle: eq("jobTitle"),
    location: eq("location"),
    experienceLevel: eq("experienceLevel"),
    currency: eq("currency"),
    minSalary: range("minSalary"),
    maxSalary: range("maxSalary"),
  },
  sortable: ["createdAt", "minSalary", "maxSalary"],
  defaultSort: "-createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["jobTitle", "location", "experienceLevel", "currency"],
};
