import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { IActionDoc, Action } from "../../../models";

// event queries
export const actionProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IActionDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Action.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
