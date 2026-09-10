import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec } from "../../../common/query";

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

/**
 * No CASL scoping on this list — unchanged by the migration. `remarks` was the
 * old `searchField`; `title`/`description` are what people actually search.
 * Anything not listed here never reaches `$match`.
 */
export const skillAssessmentListQuerySpec: ListQuerySpec = {
  filters: { level: eq("level"), category: eq("category") },
  sortable: ["createdAt", "title"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  searchFields: ["title", "description", "remarks"],
};
