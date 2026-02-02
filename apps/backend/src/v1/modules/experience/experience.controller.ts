import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as experienceService from "./experience.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["company", "position", "responsibilities"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await experienceService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Experiences retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "experiences",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const experience = await experienceService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Experience retrieved.",
    statusCode: StatusCodes.OK,
    data: experience,
    fieldName: "experience",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["company", "position", "responsibilities"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await experienceService.listSoftDeleted({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted experiences retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "experiences",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const experience = await experienceService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted experience retrieved.",
    statusCode: StatusCodes.OK,
    data: experience,
    fieldName: "experience",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;

  const experience = await experienceService.create({
    ...req.body,
    userId: userId!,
  });

  return new ApiResponse({
    message: "Experience created successfully.",
    statusCode: StatusCodes.CREATED,
    data: experience,
    fieldName: "experience",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const experience = await experienceService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Experience updated.",
    statusCode: StatusCodes.OK,
    data: experience,
    fieldName: "experience",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await experienceService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Experience moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await experienceService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Experience permanently deleted successfully.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const result = await experienceService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Experience restored successfully.",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "experience",
  });
};
