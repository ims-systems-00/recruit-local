import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { JobProfile, IJobProfileDoc } from "../../../models";

export const jobProfileProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IJobProfileDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(JobProfile.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};
