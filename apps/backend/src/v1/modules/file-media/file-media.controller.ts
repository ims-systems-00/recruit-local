import { StatusCodes } from "http-status-codes";
import { runCursorList } from "../../../common/query";
import { fileMediaListQuerySpec } from "./file-media.query";
import * as fileMediaService from "./file-media.service";
import { ApiResponse, ControllerParams } from "../../../common/helper";

export const list = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: fileMediaListQuerySpec,
    fetch: ({ query, options, offset }) => fileMediaService.list({ query, options, offset }),
    count: ({ query }) => fileMediaService.count({ query }),
  });

  return new ApiResponse({
    message: "File and medias retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "fileMedias",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "File and media retrieved.",
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "File and media updated.",
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.create({ payload: req.body });

  return new ApiResponse({
    message: "File and media created.",
    statusCode: StatusCodes.CREATED,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "File and media moved to trash.",
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "File and media permanently removed.",
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "File and media restored.",
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};
