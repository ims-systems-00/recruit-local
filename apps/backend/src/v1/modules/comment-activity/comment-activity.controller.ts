import { StatusCodes } from "http-status-codes";
import * as commentActivityService from "./comment-activity.service";
import { ApiResponse, ControllerParams } from "../../../common/helper";
import { runCursorList } from "../../../common/query";
import { commentActivityListQuerySpec } from "./comment-activity.query";
import { COMMENT_ACTIVITY_TYPE_ENUMS } from "../../../models/constants";

export const listCommentActivity = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: commentActivityListQuerySpec,
    fetch: ({ query, options, offset }) => commentActivityService.listCommentActivity({ query, options, offset }),
  });

  return new ApiResponse({
    message: "Comment and activities retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "commentActivities",
    pagination,
  });
};

export const getCommentActivity = async ({ req }: ControllerParams) => {
  const commentActivity = await commentActivityService.getCommentActivity(req.params.id);

  return new ApiResponse({
    message: "Comment and activity retrieved.",
    statusCode: StatusCodes.OK,
    data: commentActivity,
    fieldName: "commentActivity",
  });
};

export const updateCommentActivity = async ({ req }: ControllerParams) => {
  const commentActivity = await commentActivityService.updateCommentActivity(req.params.id, req.body);

  return new ApiResponse({
    message: "Comment and activity updated.",
    statusCode: StatusCodes.OK,
    data: commentActivity,
    fieldName: "commentActivity",
  });
};

export const createCommentActivity = async ({ req }: ControllerParams) => {
  const payload = {
    ...req.body,
    tenantId: null,
    createdBy: req.session.user._id,
    type: COMMENT_ACTIVITY_TYPE_ENUMS.MANUAL,
    extraLogs: [],
  };
  const commentActivity = await commentActivityService.createCommentActivity(payload);

  return new ApiResponse({
    message: "Comment and activity created.",
    statusCode: StatusCodes.CREATED,
    data: commentActivity,
    fieldName: "commentActivity",
  });
};

export const softRemoveCommentActivity = async ({ req }: ControllerParams) => {
  const { commentActivity, deleted } = await commentActivityService.softRemoveCommentActivity(req.params.id);

  return new ApiResponse({
    message: `${deleted} comment and activity moved to trash.`,
    statusCode: StatusCodes.OK,
    data: commentActivity,
    fieldName: "commentActivity",
  });
};

export const hardRemoveCommentActivity = async ({ req }: ControllerParams) => {
  const commentActivity = await commentActivityService.hardRemoveCommentActivity(req.params.id);

  return new ApiResponse({
    message: "Comment and activity removed.",
    statusCode: StatusCodes.OK,
    data: commentActivity,
    fieldName: "commentActivity",
  });
};

export const restoreCommentActivity = async ({ req }: ControllerParams) => {
  const { commentActivity, restored } = await commentActivityService.restoreCommentActivity(req.params.id);

  return new ApiResponse({
    message: `${restored} comment and activity restored.`,
    statusCode: StatusCodes.OK,
    data: commentActivity,
    fieldName: "commentActivity",
  });
};
