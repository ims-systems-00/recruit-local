import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { IBoardDoc, Board } from "../../../models";

export const boardProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IBoardDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(Board.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
