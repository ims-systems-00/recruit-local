import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { Types } from "mongoose";
import * as surveyService from "./user-interest-survey.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["interest"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await surveyService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "User interest surveys retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "userInterestSurveys",
    pagination,
  });
};

export const getMySurvey = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;

  const survey = await surveyService.getOne({ query: { userId: new Types.ObjectId(userId) } });

  return new ApiResponse({
    message: "User interest survey retrieved.",
    statusCode: StatusCodes.OK,
    data: survey,
    fieldName: "userInterestSurvey",
  });
};

export const get = async ({ req }: ControllerParams) => {
  const survey = await surveyService.getOne({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User interest survey retrieved.",
    statusCode: StatusCodes.OK,
    data: survey,
    fieldName: "userInterestSurvey",
  });
};

export const upsert = async ({ req }: ControllerParams) => {
  const userId = new Types.ObjectId(req.session.user?._id);

  const survey = await surveyService.upsert({
    userId,
    payload: req.body,
  });

  return new ApiResponse({
    message: "User interest survey saved.",
    statusCode: StatusCodes.OK,
    data: survey,
    fieldName: "userInterestSurvey",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;

  const existing = await surveyService.getOne({ query: { _id: req.params.id } });

  if (existing.userId?.toString() !== userId?.toString()) {
    throw new UnauthorizedException(`User ${userId} is not authorized to update this survey.`);
  }

  const survey = await surveyService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "User interest survey updated.",
    statusCode: StatusCodes.OK,
    data: survey,
    fieldName: "userInterestSurvey",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;

  const existing = await surveyService.getOne({ query: { _id: req.params.id } });

  if (existing.userId?.toString() !== userId?.toString()) {
    throw new UnauthorizedException(`User ${userId} is not authorized to delete this survey.`);
  }

  await surveyService.softDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User interest survey moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;

  const existing = await surveyService.getOne({ query: { _id: req.params.id } });

  if (existing.userId?.toString() !== userId?.toString()) {
    throw new UnauthorizedException(`User ${userId} is not authorized to permanently delete this survey.`);
  }

  await surveyService.hardDelete({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User interest survey permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  await surveyService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "User interest survey restored.",
    statusCode: StatusCodes.OK,
  });
};
