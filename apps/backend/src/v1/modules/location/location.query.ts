import { PipelineStage } from "mongoose";
import { omit } from "lodash";
import { Location, ILocationDoc } from "../../../models/location.model";
import { projectQuery } from "../../../common/query";

export const locationProjectQuery = (allowedFields?: string[]): PipelineStage[] => {
  let selectedFields: string[] = [];

  // If allowedFields are provided and not empty, use them
  if (allowedFields && allowedFields.length > 0) {
    selectedFields = [...allowedFields];
  } else {
    // Exclude __v or any other internal fields by default
    const fieldsToExclude: (keyof ILocationDoc | "__v")[] = ["__v"];
    selectedFields = Object.keys(omit(Location.schema.paths, fieldsToExclude));
  }

  return projectQuery(selectedFields);
};
