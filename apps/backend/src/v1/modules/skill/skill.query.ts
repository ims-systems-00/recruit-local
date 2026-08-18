import { PipelineStage } from "mongoose";
import { excludeDeletedQuery, projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { ISkillDoc, Skill } from "../../../models";

export const skillProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ISkillDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Skill.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * Reusable lookup that attaches a job profile's non-deleted `Skill` rows.
 * Skills carry `jobProfileId` from `jobProfilePlugin`, so unlike
 * `populateValuesQuery` this runs off the profile's own `_id` rather than an
 * array of references on the parent.
 *
 * Lands on `skillRecords`, not `skills`: `JobProfile.skills` already exists as a
 * free-text string and a lookup named `skills` would overwrite it.
 *
 * Projected down to what the ranking matcher reads. A profile with hundreds of
 * skills should not drag its whole subtree into memory to be tokenized.
 */
export const populateSkillsQuery = (): PipelineStage[] => {
  return [
    {
      $lookup: {
        from: Skill.collection.name,
        localField: "_id",
        foreignField: "jobProfileId",
        as: "skillRecords",
        pipeline: [
          ...excludeDeletedQuery(),
          { $project: { _id: 0, name: 1, proficiencyLevel: 1 } },
        ] as PipelineStage.Lookup["$lookup"]["pipeline"],
      },
    },
  ];
};
