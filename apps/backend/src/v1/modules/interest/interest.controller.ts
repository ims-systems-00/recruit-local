import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as interestService from "./interest.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await interestService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Interests retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "interests",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const interest = await interestService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Interest retrieved.",
    statusCode: StatusCodes.OK,
    data: interest,
    fieldName: "interest",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await interestService.listSoftDeleted({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted interests retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "interests",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const interest = await interestService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted interest retrieved.",
    statusCode: StatusCodes.OK,
    data: interest,
    fieldName: "interest",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;

  const interest = await interestService.create({
    ...req.body,
    userId: userId!,
  });

  return new ApiResponse({
    message: "Interest created.",
    statusCode: StatusCodes.CREATED,
    data: interest,
    fieldName: "interest",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const interest = await interestService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Interest updated.",
    statusCode: StatusCodes.OK,
    data: interest,
    fieldName: "interest",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await interestService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Interest moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await interestService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Interest permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const result = await interestService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Interest restored.",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "interest",
  });
};
