import { StatusCodes } from "http-status-codes";
import { buildListQuery, runCursorList } from "../../../common/query";
import { eventListQuerySpec } from "./event.query";
import * as eventService from "./event.service";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";

export const list = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: eventListQuerySpec,
    fetch: ({ query, options, offset }) => eventService.list({ query, options, offset }),
    count: ({ query }) => eventService.count({ query }),
  });

  return new ApiResponse({
    message: "Events retrieved",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "events",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const event = await eventService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: `Event ${req.params.id} retrieved`,
    statusCode: StatusCodes.OK,
    data: event,
    fieldName: "event",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  // Trash still pages by offset — only the filter building moves off MongoQuery.
  const { filter, options, page } = buildListQuery(req.query, eventListQuerySpec);

  const results = await eventService.listSoftDeleted({ query: filter, options: { ...options, page: page ?? 1 } });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted events retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "events",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const event = await eventService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: `Deleted event ${req.params.id} retrieved`,
    statusCode: StatusCodes.OK,
    data: event,
    fieldName: "event",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const tenantId = req.session.tenantId;

  if (tenantId) {
    req.body.organizers = req.body.organizers || [];
    req.body.organizers.push(tenantId);
  }

  const event = await eventService.create({
    payload: req.body,
  });

  return new ApiResponse({
    message: "Event created",
    statusCode: StatusCodes.CREATED,
    data: event,
    fieldName: "event",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const updatedEvent = await eventService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: `Event ${req.params.id} updated.`,
    statusCode: StatusCodes.OK,
    data: updatedEvent,
    fieldName: "event",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  // Updated to call softDelete
  await eventService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: `Event ${req.params.id} moved to trash.`,
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await eventService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: `Event ${req.params.id} permanently removed.`,
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const result = await eventService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: `Event ${req.params.id} restored.`,
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "event",
  });
};
