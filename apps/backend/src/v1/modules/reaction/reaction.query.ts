import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { Reaction, IReactionDoc } from "../../../models";

export const reactionProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IReactionDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Reaction.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};
