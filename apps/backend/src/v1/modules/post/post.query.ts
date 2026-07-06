import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { Post, IPostDoc } from "../../../models";

export const postProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IPostDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Post.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};
