import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as skillAssessmentResultService from "./sar.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["score", "recommendations"], // Adjusted search fields
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await skillAssessmentResultService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Skill assessment results retrieved",
    statusCode: StatusCodes.OK,
    data,
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
  const filter = new MongoQuery(req.query, {
    searchFields: ["score", "recommendations"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await skillAssessmentResultService.listSoftDeleted({ query, options });
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
