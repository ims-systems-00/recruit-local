import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as postService from "./post.service";

export const create = async ({ req }: ControllerParams) => {
  const userId = req.session?.user?._id;
  if (!userId) {
    return new ApiResponse({
      message: "Unauthorized",
      statusCode: StatusCodes.UNAUTHORIZED,
    });
  }
  const post = await postService.create({ ...req.body, userId });

  return new ApiResponse({
    message: "Post created.",
    statusCode: StatusCodes.CREATED,
    data: post,
    fieldName: "post",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const post = await postService.update({ _id: req.params.id }, req.body);

  return new ApiResponse({
    message: "Post updated.",
    statusCode: StatusCodes.OK,
    data: post,
    fieldName: "post",
  });
};

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "content"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await postService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Posts retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "posts",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const post = await postService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Post retrieved.",
    statusCode: StatusCodes.OK,
    data: post,
    fieldName: "post",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "content"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await postService.listSoftDeleted({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted posts retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "posts",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const post = await postService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Soft deleted post retrieved.",
    statusCode: StatusCodes.OK,
    data: post,
    fieldName: "post",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await postService.softDelete({ _id: req.params.id });

  return new ApiResponse({
    message: "Post soft deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  await postService.restore({ _id: req.params.id });

  return new ApiResponse({
    message: "Post restored.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await postService.hardDelete({ _id: req.params.id });

  return new ApiResponse({
    message: "Post permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};
