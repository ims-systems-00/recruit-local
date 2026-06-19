import { PipelineStage } from "mongoose";
import { excludeDeletedQuery, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IValueDoc, Value } from "../../../models";

export const valueProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IValueDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Value.schema.paths, fieldsToExclude));
  return projectQuery(selectedFields);
};

/**
 * Reusable lookup that replaces a parent document's `values` array of ObjectIds
 * with the populated, non-deleted value documents. Used by tenant and job-profile reads.
 */
export const populateValuesQuery = (): PipelineStage[] => {
  return [
    {
      $lookup: {
        from: Value.collection.name,
        localField: "values",
        foreignField: "_id",
        as: "values",
        pipeline: [...excludeDeletedQuery(), ...valueProjectQuery()] as PipelineStage.Lookup["$lookup"]["pipeline"],
      },
    },
  ];
};
