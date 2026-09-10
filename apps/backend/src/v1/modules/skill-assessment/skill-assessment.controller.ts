import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import { buildListQuery, runCursorList } from "../../../common/query";
import { skillAssessmentListQuerySpec } from "./skill-assessment.query";
import * as skillAssessmentService from "./skill-assessment.service";

export const list = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: skillAssessmentListQuerySpec,
    fetch: ({ query, options, offset }) => skillAssessmentService.list({ query, options, offset }),
    count: ({ query }) => skillAssessmentService.count({ query }),
  });

  return new ApiResponse({
    message: "Skill assessments retrieved",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "skillAssessments",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const skillAssessment = await skillAssessmentService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill assessment retrieved",
    statusCode: StatusCodes.OK,
    data: skillAssessment,
    fieldName: "skillAssessment",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  // Trash still pages by offset — only the filter building moves off MongoQuery.
  const { filter, options, page } = buildListQuery(req.query, skillAssessmentListQuerySpec);

  const results = await skillAssessmentService.listSoftDeleted({
    query: filter,
    options: { ...options, page: page ?? 1 },
  });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted skill assessments retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "skillAssessments",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const skillAssessment = await skillAssessmentService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted skill assessment retrieved",
    statusCode: StatusCodes.OK,
    data: skillAssessment,
    fieldName: "skillAssessment",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const newSkillAssessment = await skillAssessmentService.create(req.body);

  return new ApiResponse({
    message: "Skill assessment created",
    statusCode: StatusCodes.CREATED,
    data: newSkillAssessment,
    fieldName: "skillAssessment",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const updatedSkillAssessment = await skillAssessmentService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Skill assessment updated",
    statusCode: StatusCodes.OK,
    data: updatedSkillAssessment,
    fieldName: "skillAssessment",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await skillAssessmentService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill assessment moved to trash",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await skillAssessmentService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill assessment permanently deleted",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const restoredSkillAssessment = await skillAssessmentService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill assessment restored",
    statusCode: StatusCodes.OK,
    data: restoredSkillAssessment,
    fieldName: "skillAssessment",
  });
};
