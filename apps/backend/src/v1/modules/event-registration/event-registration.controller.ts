import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as eventRegistrationService from "./event-registration.service";
import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["status"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await eventRegistrationService.list({
    query,
    options,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Event registrations retrieved",
    statusCode: StatusCodes.OK,
    data,
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
  const filter = new MongoQuery(req.query, {
    searchFields: ["status"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await eventRegistrationService.listSoftDeleted({
    query,
    options,
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
