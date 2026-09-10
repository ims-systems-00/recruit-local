import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import { buildListQuery, runCursorList } from "../../../common/query";
import { eventRegistrationListQuerySpec } from "./event-registration.query";
import * as eventRegistrationService from "./event-registration.service";
import { StatusCodes } from "http-status-codes";

export const list = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: eventRegistrationListQuerySpec,
    fetch: ({ query, options, offset }) => eventRegistrationService.list({ query, options, offset }),
    count: ({ query }) => eventRegistrationService.count({ query }),
  });

  return new ApiResponse({
    message: "Event registrations retrieved",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "eventRegistrations",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const eventRegistration = await eventRegistrationService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Event registration retrieved",
    statusCode: StatusCodes.OK,
    data: eventRegistration,
    fieldName: "eventRegistration",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  // Trash still pages by offset — only the filter building moves off MongoQuery.
  const { filter, options, page } = buildListQuery(req.query, eventRegistrationListQuerySpec);

  const results = await eventRegistrationService.listSoftDeleted({
    query: filter,
    options: { ...options, page: page ?? 1 },
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted event registrations retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "eventRegistrations",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const eventRegistration = await eventRegistrationService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted event registration retrieved",
    statusCode: StatusCodes.OK,
    data: eventRegistration,
    fieldName: "eventRegistration",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;
  req.body.userId = userId;

  const createdEventRegistration = await eventRegistrationService.create(req.body);

  return new ApiResponse({
    message: "Event registration created",
    statusCode: StatusCodes.CREATED,
    data: createdEventRegistration,
    fieldName: "eventRegistration",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const updatedEventRegistration = await eventRegistrationService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Event registration updated",
    statusCode: StatusCodes.OK,
    data: updatedEventRegistration,
    fieldName: "eventRegistration",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await eventRegistrationService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Event registration moved to trash",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await eventRegistrationService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Event registration permanently deleted",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const restoredEventRegistration = await eventRegistrationService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Event registration restored",
    statusCode: StatusCodes.OK,
    data: restoredEventRegistration,
    fieldName: "eventRegistration",
  });
};
