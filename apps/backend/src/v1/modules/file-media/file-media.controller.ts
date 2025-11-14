import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as fileMediaService from "./file-media.service";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";

export const listFileMedia = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["collectionName"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await fileMediaService.listFileMedia({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "File and medias retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "fileMedias",
    pagination,
  });
};

export const getFileMedia = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.getFileMedia(req.params.id);

  return new ApiResponse({
    message: "File and media retrieved.",
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const updateFileMedia = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.updateFileMedia(req.params.id, req.body);

  return new ApiResponse({
    message: "File and media updated.",
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const createFileMedia = async ({ req }: ControllerParams) => {
  const payload = { ...req.body, tenantId: null };
  const fileMedia = await fileMediaService.createFileMedia(payload);

  return new ApiResponse({
    message: "File and media created.",
    statusCode: StatusCodes.CREATED,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const softRemoveFileMedia = async ({ req }: ControllerParams) => {
  const { fileMedia, deleted } = await fileMediaService.softRemoveFileMedia(req.params.id);

  return new ApiResponse({
    message: `${deleted} file and media moved to trash.`,
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const hardRemoveFileMedia = async ({ req }: ControllerParams) => {
  const fileMedia = await fileMediaService.hardRemoveFileMedia(req.params.id);

  return new ApiResponse({
    message: "File and media removed.",
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};

export const restoreFileMedia = async ({ req }: ControllerParams) => {
  const { fileMedia, restored } = await fileMediaService.restoreFileMedia(req.params.id);

  return new ApiResponse({
    message: `${restored} file and media restored.`,
    statusCode: StatusCodes.OK,
    data: fileMedia,
    fieldName: "fileMedia",
  });
};
