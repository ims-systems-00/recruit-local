import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { VISIBILITY_ENUM } from "@rl/types";
import { projectQuery } from "../../../common/query";
import { IFileMediaDoc, FileMedia } from "../../../models";

// event queries
export const fileMediaProjectionQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof IFileMediaDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(FileMedia.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

export const fileMediaSrcQuery = (): PipelineStage[] => {
  const baseUrl = process.env.PUBLIC_MEDIA_BASE_URL || "";
  return [
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
  ];
};
