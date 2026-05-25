import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IExperienceLevelDoc, ExperienceLevel } from "../../../models";

export const experienceLevelProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IExperienceLevelDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(ExperienceLevel.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
