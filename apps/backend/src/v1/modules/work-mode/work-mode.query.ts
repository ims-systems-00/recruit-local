import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IWorkModeDoc, WorkMode } from "../../../models";

export const workModeProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IWorkModeDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(WorkMode.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
