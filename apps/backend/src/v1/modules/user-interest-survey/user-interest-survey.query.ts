import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IUserInterestSurveyDoc, UserInterestSurvey } from "../../../models/user-interest-survey.model";

export const userInterestSurveyProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IUserInterestSurveyDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(UserInterestSurvey.schema.paths, fieldsToExclude));
  return projectQuery(selectedFields);
};
