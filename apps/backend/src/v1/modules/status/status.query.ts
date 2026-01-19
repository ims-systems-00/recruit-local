import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { IStatusDoc, Status } from "../../../models";

// event queries
export const statusProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IStatusDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Status.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
