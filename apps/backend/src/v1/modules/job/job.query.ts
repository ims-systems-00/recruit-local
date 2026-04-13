import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { omit } from "lodash";
import { IJobDoc, Job } from "../../../models";
import { JobAbilityBuilder, JobAuthZEntity } from "@rl/authz";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "@rl/types";
import { modelNames } from "../../../models/constants";
import { VISIBILITY_ENUM } from "@rl/types";

export const jobRoleScopedSecurityQuery = (ability: ReturnType<JobAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(JobAuthZEntity);
  return query;
};

export const jobProjectionQuery = (allowedFields?: string[]): PipelineStage[] => {
  let selectedFields: string[] = [];

  if (allowedFields && allowedFields.length > 0) {
    selectedFields = [...allowedFields];
  } else {
    const fieldsToExclude: (keyof IJobDoc | "__v")[] = ["__v"];
    selectedFields = Object.keys(omit(Job.schema.paths, fieldsToExclude));
  }

  return projectQuery(selectedFields);
};

export const jobAttachmentsLookupQuery = (): PipelineStage[] => {
  const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "";

  return [
    {
      $lookup: {
        from: modelNames.FILE_MEDIA,
        let: { attachmentIds: "$attachmentIds" },
        pipeline: [
          //  Match the documents by ID
          {
            $match: {
              $expr: {
                $and: [
                  { $in: ["$_id", { $ifNull: ["$$attachmentIds", []] }] },
                  // { $ne: ["$deleted", true] },
                ],
              },
            },
          },
          // Add the virtual 'src' field using your logic
          {
            $addFields: {
              src: {
                $cond: {
                  // Check if visibility is PUBLIC
                  if: { $eq: ["$visibility", VISIBILITY_ENUM.PUBLIC] },

                  // If true, concatenate the S3 URL pieces
                  then: {
                    $concat: [baseUrl, "/", "$storageInformation.Key"],
                  },

                  // If false (private), return null
                  else: null,
                },
              },
            },
          },
        ],
        as: "attachments",
      },
    },
  ];
};
