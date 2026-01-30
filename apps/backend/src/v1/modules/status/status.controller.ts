import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as statusService from "./status.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["label", "value"], // Added 'value' as a likely search field
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await statusService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Statuses retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "statuses",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const status = await statusService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status retrieved.",
    statusCode: StatusCodes.OK,
    data: status,
    fieldName: "status",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["label", "value"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await statusService.listSoftDeleted({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted statuses retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "statuses",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const status = await statusService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted status retrieved",
    statusCode: StatusCodes.OK,
    data: status,
    fieldName: "status",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const status = await statusService.create(req.body);

  return new ApiResponse({
    message: "Status created.",
    statusCode: StatusCodes.CREATED,
    data: status,
    fieldName: "status",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const status = await statusService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Status updated.",
    statusCode: StatusCodes.OK,
    data: status,
    fieldName: "status",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await statusService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await statusService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const result = await statusService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status restored from trash.",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "status",
  });
};
