import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IIndustryDoc, Industry } from "../../../models";

export const industryProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IIndustryDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Industry.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
