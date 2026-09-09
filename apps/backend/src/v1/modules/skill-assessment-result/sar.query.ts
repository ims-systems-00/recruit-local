import { omit } from "lodash";
import { PipelineStage } from "mongoose";
import { eq, ListQuerySpec, projectQuery } from "../../../common/query";
import { SkillAssessmentResult, ISkillAssessmentResultDoc } from "../../../models";

// event queries
export const skillAssessmentResultQuery = (): PipelineStage[] => {
  const fieldsToExclude: (keyof ISkillAssessmentResultDoc | "__v")[] = ["__v"];

  const selectedFields = Object.keys(omit(SkillAssessmentResult.schema.paths, fieldsToExclude));

  return projectQuery(selectedFields);
};

/**
 * No CASL scoping on this list — unchanged by the migration. `minScore`/`maxScore`
 * are two separate query keys rather than one range object, so the controller
 * composes them; everything else is declared here.
 */
export const sarListQuerySpec: ListQuerySpec = {
  filters: { jobProfileId: eq("jobProfileId"), skillAssessmentId: eq("skillAssessmentId") },
  sortable: ["createdAt", "score"],
  defaultSort: "-createdAt",
  searchKey: "clientSearch",
  // `score` is a Number — a regex against it never matched, so it is not here.
  searchFields: ["recommendations"],
};

/** `?minScore=40&maxScore=80` -> `{ score: { $gte: 40, $lte: 80 } }`, or nothing. */
export const sarScoreCondition = (minScore?: number, maxScore?: number): Record<string, unknown>[] => {
  const bounds: Record<string, number> = {};
  if (typeof minScore === "number") bounds.$gte = minScore;
  if (typeof maxScore === "number") bounds.$lte = maxScore;
  return Object.keys(bounds).length ? [{ score: bounds }] : [];
};
