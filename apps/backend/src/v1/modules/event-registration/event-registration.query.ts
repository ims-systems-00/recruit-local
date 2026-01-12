import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { EventRegistrationInput, EventRegistration } from "../../../models";

export const eventRegistrationProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof EventRegistrationInput | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(EventRegistration.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};
