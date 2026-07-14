import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { ISalaryDoc, Salary } from "../../../models";

export const salaryProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ISalaryDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Salary.schema.paths, fieldsToExclude));
  return projectQuery(selectedFields);
};
