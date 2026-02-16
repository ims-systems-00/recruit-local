import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IJobDoc, Job } from "../../../models";

export const jobProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IJobDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Job.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};
