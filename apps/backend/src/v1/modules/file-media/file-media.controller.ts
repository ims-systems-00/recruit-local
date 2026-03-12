import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as fileMediaService from "./file-media.service";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["collectionName"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  // This one already matches the service structure perfectly
  const results = await fileMediaService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "File and medias retrieved.",
    statusCode: StatusCodes.OK,
    data,
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
