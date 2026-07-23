import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { ISkillDoc, Skill } from "../../../models";

export const skillProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ISkillDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Skill.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
