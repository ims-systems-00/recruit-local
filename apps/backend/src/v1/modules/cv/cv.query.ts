import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { projectQuery } from "../../../common/query";
import { ICVDoc, CV } from "../../../models";

export const populateStatusQuery = (): PipelineStage[] => {
  return [
    {
      $lookup: {
        from: "statuses",
        localField: "statusId",
        foreignField: "_id",
        as: "status",
      },
    },
    {
      $unwind: {
        path: "$status",
        preserveNullAndEmptyArrays: true,
      },
    },
    {
      $addFields: {
        status: { $ifNull: ["$status.label", "unknown"] },
      },
    },
    {
      $project: {
        statusId: 0,
        statusLabel: 0,
      },
    },
  ];
};

export const cvProjectQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ICVDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(CV.schema.paths, fieldsToExclude));
  selectedFields.push("status");

  return projectQuery(selectedFields);
};
