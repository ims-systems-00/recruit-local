import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { IEducationDoc, Education } from "../../../models";

export const educationProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IEducationDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Education.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
