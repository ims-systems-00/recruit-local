import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IValueDoc, Value } from "../../../models";

export const valueProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IValueDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Value.schema.paths, fieldsToExclude));
  return projectQuery(selectedFields);
};
