import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as eventService from "./event.service";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "description", "location"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await eventService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Events retrieved",
    statusCode: StatusCodes.OK,
    data,
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
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "description", "location"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await eventService.listSoftDeleted({ query, options });
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

  const event = await eventService.create(req.body);

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
  await eventService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: `Event ${req.params.id} moved to trash.`,
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await eventService.hardRemove({
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
