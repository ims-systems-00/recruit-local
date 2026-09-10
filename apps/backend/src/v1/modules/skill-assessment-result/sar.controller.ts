import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import { buildListQuery, runCursorList } from "../../../common/query";
import { sarListQuerySpec, sarScoreCondition } from "./sar.query";
import * as skillAssessmentResultService from "./sar.service";

export const list = async ({ req }: ControllerParams) => {
  const { minScore, maxScore } = req.query as { minScore?: number; maxScore?: number };

  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: sarListQuerySpec,
    // Two query keys, one field — the spec builds one condition per key, so this
    // pair is composed here instead.
    extraConditions: sarScoreCondition(minScore, maxScore),
    fetch: ({ query, options, offset }) => skillAssessmentResultService.list({ query, options, offset }),
    count: ({ query }) => skillAssessmentResultService.count({ query }),
  });

  return new ApiResponse({
    message: "Skill assessment results retrieved",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "skillAssessmentResults",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const skillAssessmentResult = await skillAssessmentResultService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill assessment result retrieved",
    statusCode: StatusCodes.OK,
    data: skillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  // Trash still pages by offset — only the filter building moves off MongoQuery.
  const { filter, options, page } = buildListQuery(req.query, sarListQuerySpec);

  const results = await skillAssessmentResultService.listSoftDeleted({
    query: filter,
    options: { ...options, page: page ?? 1 },
  });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted skill assessment results retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "skillAssessmentResults",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const skillAssessmentResult = await skillAssessmentResultService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted skill assessment result retrieved",
    statusCode: StatusCodes.OK,
    data: skillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const create = async ({ req }: ControllerParams) => {
  // TODO: Retrieve job profile ID or user context from session if needed

  const skillAssessmentResult = await skillAssessmentResultService.create(req.body);

  return new ApiResponse({
    message: "Skill assessment result created",
    statusCode: StatusCodes.CREATED,
    data: skillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const updatedSkillAssessmentResult = await skillAssessmentResultService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Skill assessment result updated",
    statusCode: StatusCodes.OK,
    data: updatedSkillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await skillAssessmentResultService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill assessment result moved to trash",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await skillAssessmentResultService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill assessment result permanently deleted",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const restoredSkillAssessmentResult = await skillAssessmentResultService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill assessment result restored from trash",
    statusCode: StatusCodes.OK,
    data: restoredSkillAssessmentResult,
    fieldName: "skillAssessmentResult",
  });
};
