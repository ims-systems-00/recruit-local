import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IInterestDoc, Interest } from "../../../models";

export const interestProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IInterestDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Interest.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
