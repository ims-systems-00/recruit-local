import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { SkillAssessmentResult, ISkillAssessmentResultDoc } from "../../../models";

// event queries
export const skillAssessmentResultQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ISkillAssessmentResultDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(SkillAssessmentResult.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
