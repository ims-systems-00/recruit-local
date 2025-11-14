import { StatusCodes } from "http-status-codes";
import * as notificationService from "./notification.service";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";

export const listNotification = async ({ req }: ControllerParams) => {
  const { page, limit } = req.query;

  const query = {};
  const options = { page, limit };
  const results = await notificationService.listNotification({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Notifications retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "notifications",
    pagination,
  });
};

export const getNotification = async ({ req }: ControllerParams) => {
  const notification = await notificationService.getNotification(req.params.id);

  return new ApiResponse({
    message: "Notification retrieved.",
    statusCode: StatusCodes.OK,
    data: notification,
    fieldName: "notification",
  });
};

export const updateNotification = async ({ req }: ControllerParams) => {
  const notification = await notificationService.updateNotification(req.params.id, req.body);

  return new ApiResponse({
    message: "Notification updated.",
    statusCode: StatusCodes.OK,
    data: notification,
    fieldName: "notification",
  });
};

export const createNotification = async ({ req }: ControllerParams) => {
  const payload = { ...req.body, userId: null, deliveredAt: new Date() };
  const notification = await notificationService.createNotification(payload);

  return new ApiResponse({
    message: "Notification created.",
    statusCode: StatusCodes.CREATED,
    data: notification,
    fieldName: "notification",
  });
};

export const softRemoveNotification = async ({ req }: ControllerParams) => {
  const { notification, deleted } = await notificationService.softRemoveNotification(req.params.id);

  return new ApiResponse({
    message: `${deleted} notification moved to trash.`,
    statusCode: StatusCodes.OK,
    data: notification,
    fieldName: "notification",
  });
};

export const hardRemoveNotification = async ({ req }: ControllerParams) => {
  const notification = await notificationService.hardRemoveNotification(req.params.id);

  return new ApiResponse({
    message: "Notification removed.",
    statusCode: StatusCodes.OK,
    data: notification,
    fieldName: "notification",
  });
};

export const restoreNotification = async ({ req }: ControllerParams) => {
  const { notification, restored } = await notificationService.restoreNotification(req.params.id);

  return new ApiResponse({
    message: `${restored} notification restored.`,
    statusCode: StatusCodes.OK,
    data: notification,
    fieldName: "notification",
  });
};
