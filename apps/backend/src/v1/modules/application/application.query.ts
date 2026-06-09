import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { IApplicationDoc, Application } from "../../../models";
import { accessibleBy } from "@casl/mongoose";
import { AbilityAction } from "../../../types/ability";
import { modelNames } from "../../../models/constants";
import { ApplicationAbilityBuilder, ApplicationAuthZEntity } from "@rl/authz";
import { VISIBILITY_ENUM } from "@rl/types";

export const applicationProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IApplicationDoc | "__v")[] = ["__v"];
  const selectedFields = Object.keys(omit(Application.schema.paths, fieldsToExclude));
  selectedFields.push("jobProfile");
  selectedFields.push("resume");
  selectedFields.push("caseStudies");
  selectedFields.push("status");

  return projectQuery(selectedFields);
};

export const populateJobProfileQuery = (): PipelineStage[] => [
  {
    $lookup: {
      from: modelNames.JOB_PROFILE,
      localField: "jobProfileId",
      foreignField: "_id",

      pipeline: [
        {
          $project: {
            name: 1,
            email: 1,
          },
        },
      ],
      as: "jobProfile",
    },
  },
  {
    $unwind: {
      path: "$jobProfile",
      preserveNullAndEmptyArrays: true,
    },
  },
];

export const applicationRoleScopedSecurityQuery = (ability: ReturnType<ApplicationAbilityBuilder["getAbility"]>) => {
  const query = accessibleBy(ability, AbilityAction.Read).ofType(ApplicationAuthZEntity);
  return query;
};

export const populateFilesQuery = (): PipelineStage[] => {
  const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "";

  return [
    // 1. Populate the Resume (Single ObjectId)
    {
      $lookup: {
        from: modelNames.FILE_MEDIA,
        let: { resumeId: "$resumeId" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: ["$_id", "$$resumeId"], // Exact match for single ID
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
          // Exclusion projection to avoid mixed projection errors
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
        as: "resume",
      },
    },
    {
      $unwind: {
        path: "$resume",
        preserveNullAndEmptyArrays: true,
      },
    },

    // 2. Populate Case Studies (Array of ObjectIds)
    {
      $lookup: {
        from: modelNames.FILE_MEDIA,
        let: { caseStudyIds: "$caseStudyId" }, // Matches your schema's array field name
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [{ $in: ["$_id", { $ifNull: ["$$caseStudyIds", []] }] }],
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
          // Exclusion projection to avoid mixed projection errors
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
        as: "caseStudies", // Output as a clean array
      },
    },
  ];
};

export const populateStatusQuery = (): PipelineStage[] => [
  {
    $lookup: {
      from: modelNames.STATUS,
      localField: "statusId",
      foreignField: "_id",
      pipeline: [
        {
          $project: {
            label: 1,
          },
        },
      ],
      as: "status",
    },
  },
  {
    $unwind: { path: "$status", preserveNullAndEmptyArrays: true },
  },
];
