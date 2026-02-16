import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { ICVDoc, CV } from "../../../models";

export const cvProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ICVDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(CV.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};
