import { StatusCodes } from "http-status-codes";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import { buildListQuery, runCursorList } from "../../../common/query";
import { statusListQuerySpec } from "./status.query";
import * as statusService from "./status.service";
import { toStatusResponse, toStatusResponseList } from "./status.dto";

export const list = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: statusListQuerySpec,
    fetch: ({ query, options, offset }) => statusService.list({ query, options, offset }),
    count: ({ query }) => statusService.count({ query }),
  });

  return new ApiResponse({
    message: "Statuses retrieved.",
    statusCode: StatusCodes.OK,
    data: toStatusResponseList(docs),
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
    data: toStatusResponse(status),
    fieldName: "status",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  // Trash still pages by offset — only the filter building moves off MongoQuery.
  const { filter, options, page } = buildListQuery(req.query, statusListQuerySpec);

  const results = await statusService.listSoftDeleted({ query: filter, options: { ...options, page: page ?? 1 } });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted statuses retrieved",
    statusCode: StatusCodes.OK,
    data: toStatusResponseList(data),
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
    data: toStatusResponse(status),
    fieldName: "status",
  });
};

export const create = async ({ req }: ControllerParams) => {
  // Updated to strictly pass payload object
  const status = await statusService.create({
    payload: req.body,
  });

  return new ApiResponse({
    message: "Status created.",
    statusCode: StatusCodes.CREATED,
    data: toStatusResponse(status),
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
    data: toStatusResponse(status),
    fieldName: "status",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  // Updated to point to softDelete
  const status = await statusService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status moved to trash.",
    statusCode: StatusCodes.OK,
    data: toStatusResponse(status),
    fieldName: "status",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  // Updated to point to hardDelete
  const status = await statusService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status permanently deleted.",
    statusCode: StatusCodes.OK,
    data: toStatusResponse(status),
    fieldName: "status",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const status = await statusService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status restored from trash.",
    statusCode: StatusCodes.OK,
    data: toStatusResponse(status),
    fieldName: "status",
  });
};
