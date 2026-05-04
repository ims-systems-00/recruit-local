import { PipelineStage, Types } from "mongoose";
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
          {
            $match: {
              $expr: {
                $and: [{ $in: ["$_id", { $ifNull: ["$$attachmentIds", []] }] }],
              },
            },
          },
          {
            $addFields: {
              src: {
                $cond: {
                  if: { $eq: ["$visibility", VISIBILITY_ENUM.PUBLIC] },
                  then: { $concat: [baseUrl, "/", "$storageInformation.Key"] },
                  else: null,
                },
              },
            },
          },
          // FIX: Use exclusion ONLY to avoid the "mixed projection" error
          {
            $project: {
              deleteMarker: 0,
              __v: 0,
              collectionName: 0,
              collectionDocument: 0,
              createdAt: 0,
              updatedAt: 0,
            },
          },
        ],
        as: "attachments",
      },
    },
  ];
};

export const alreadyAlliped = (jobProfileId?: string): PipelineStage[] => {
  if (!jobProfileId || !Types.ObjectId.isValid(jobProfileId)) {
    return [{ $addFields: { alreadyApplied: false } }];
  }

  const jobProfileObjectId = new Types.ObjectId(jobProfileId);

  return [
    {
      $lookup: {
        from: modelNames.APPLICATION,
        let: { currentJobId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $eq: ["$jobId", "$$currentJobId"] }, { $eq: ["$jobProfileId", jobProfileObjectId] }],
              },
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: "alreadyAppliedLookup",
      },
    },
    {
      $addFields: {
        alreadyApplied: {
          $gt: [{ $size: "$alreadyAppliedLookup" }, 0],
        },
      },
    },
    {
      $project: {
        alreadyAppliedLookup: 0,
      },
    },
  ];
};

export const alreadysaved = (userId?: string): PipelineStage[] => {
  if (!userId || !Types.ObjectId.isValid(userId)) {
    return [{ $addFields: { alreadySaved: false } }];
  }

  const userObjectId = new Types.ObjectId(userId);

  return [
    {
      $lookup: {
        from: modelNames.FAVOURITE,
        let: { currentJobId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$userId", userObjectId] },
                  { $eq: ["$itemType", modelNames.JOB] },
                  { $eq: ["$itemId", "$$currentJobId"] },
                ],
              },
            },
          },
          {
            $limit: 1,
          },
          {
            $project: {
              _id: 1,
            },
          },
        ],
        as: "alreadySavedLookup",
      },
    },
    {
      $addFields: {
        alreadySaved: {
          $gt: [{ $size: "$alreadySavedLookup" }, 0],
        },
      },
    },
    {
      $project: {
        alreadySavedLookup: 0,
      },
    },
  ];
};
