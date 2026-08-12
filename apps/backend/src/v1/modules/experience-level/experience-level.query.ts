import { PipelineStage } from "mongoose";
import { excludeDeletedQuery, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IExperienceLevelDoc, ExperienceLevel } from "../../../models";

export const experienceLevelProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IExperienceLevelDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(ExperienceLevel.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * Reusable lookup that replaces a job profile's `experienceLevel` ObjectId with
 * the populated, non-deleted level document. Unlike `populateValuesQuery` the
 * field is a single reference rather than an array, so the lookup is unwound
 * back down to one document — `preserveNullAndEmptyArrays` keeps profiles that
 * never set a level, which read back as having no `experienceLevel` at all.
 */
export const populateExperienceLevelQuery = (): PipelineStage[] => {
  return [
    {
      $lookup: {
        from: ExperienceLevel.collection.name,
        localField: "experienceLevel",
        foreignField: "_id",
        as: "experienceLevel",
        pipeline: [
          ...excludeDeletedQuery(),
          ...experienceLevelProjectQuery(),
        ] as PipelineStage.Lookup["$lookup"]["pipeline"],
      },
    },
    { $unwind: { path: "$experienceLevel", preserveNullAndEmptyArrays: true } },
  ];
};
