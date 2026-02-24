import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as reactionService from "./reaction.service";

export const create = async ({ req }: ControllerParams) => {
  const userId = req.session?.user?._id;
  if (!userId) {
    return new ApiResponse({
      message: "Unauthorized",
      statusCode: StatusCodes.UNAUTHORIZED,
    });
  }
  const reaction = await reactionService.create({ ...req.body, userId });

  return new ApiResponse({
    message: "Reaction created.",
    statusCode: StatusCodes.CREATED,
    data: reaction,
    fieldName: "reaction",
  });
};

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["type"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await reactionService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Reactions retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "reactions",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const reaction = await reactionService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Reaction retrieved",
    statusCode: StatusCodes.OK,
    data: reaction,
    fieldName: "reaction",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const reaction = await reactionService.update({ _id: req.params.id, ...req.body });

  return new ApiResponse({
    message: "Reaction updated.",
    statusCode: StatusCodes.OK,
    data: reaction,
    fieldName: "reaction",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await reactionService.softRemove({ _id: req.params.id });

  return new ApiResponse({
    message: "Reaction soft deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  await reactionService.restore({ _id: req.params.id });

  return new ApiResponse({
    message: "Reaction restored.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await reactionService.hardRemove({ _id: req.params.id });

  return new ApiResponse({
    message: "Reaction permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};
