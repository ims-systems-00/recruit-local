import { PipelineStage } from "mongoose";
import { excludeDeletedQuery, ListQuerySpec, projectQuery } from "../../../common/query";
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

/**
 * `isActive` is not a filter here — the controller pins it, because this endpoint
 * only ever serves the active catalog. Anything not listed below never reaches
 * `$match`; `listQuerySchema` is what turns an unknown key into a 400.
 */
export const experienceLevelListQuerySpec: ListQuerySpec = {
  filters: {},
  sortable: ["createdAt", "name", "updatedAt"],
  defaultSort: "createdAt",
  // Kept from the old MongoQuery contract so no frontend call site has to change.
  searchKey: "clientSearch",
  searchFields: ["name", "description"],
};
