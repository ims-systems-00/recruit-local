import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { IApplicationDoc, Application } from "../../../models";

// event queries
export const applicationProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IApplicationDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Application.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
