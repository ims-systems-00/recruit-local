import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IKeywordDoc, Keyword } from "../../../models";

export const keywordProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IKeywordDoc | "__v")[] = ["__v", "embedding"];
  const selectedFields = Object.keys(omit(Keyword.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
