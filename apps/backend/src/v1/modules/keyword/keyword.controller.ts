import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as keywordService from "./keyword.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["text"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await keywordService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Keywords retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "keywords",
    pagination,
  });
};

export const create = async ({ req }: ControllerParams) => {
  const keywords = await keywordService.create({
    payload: req.body,
  });

  return new ApiResponse({
    message: "Keywords created.",
    statusCode: StatusCodes.CREATED,
    data: keywords,
    fieldName: "keywords",
  });
};

export const search = async ({ req }: ControllerParams) => {
  const { query, limit } = req.query as { query: string; limit?: string };

  const results = await keywordService.search({
    query,
    limit: limit ? parseInt(limit, 10) : undefined,
  });

  return new ApiResponse({
    message: "Keywords searched.",
    statusCode: StatusCodes.OK,
    data: results,
    fieldName: "keywords",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const keyword = await keywordService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Keyword moved to trash.",
    statusCode: StatusCodes.OK,
    data: keyword,
    fieldName: "keyword",
  });
};
