import { PipelineStage } from "mongoose";

export const skillAssessmentProjectionQuery = (): PipelineStage[] => {
  return [
    {
      $addFields: {
        totalPoints: { $sum: "$questions.points" },
      },
    },
    {
      $project: {
        __v: 0,
      },
    },
  ];
};
