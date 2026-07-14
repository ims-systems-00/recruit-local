import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IJobTitleDoc, JobTitle } from "../../../models";

export const jobTitleProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IJobTitleDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(JobTitle.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
