import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";

import * as jobService from "./job.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "company", "location"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await jobService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Jobs retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "jobs",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const job = await jobService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job retrieved.",
    statusCode: StatusCodes.OK,
    data: job,
    fieldName: "job",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "company", "location"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await jobService.listSoftDeleted({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted jobs retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "jobs",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const job = await jobService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted job retrieved.",
    statusCode: StatusCodes.OK,
    data: job,
    fieldName: "job",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const tenantId = req.session.tenantId;

  // Note: Validation regarding account type is currently commented out in your original code
  // if (req.session.user.type !== ACCOUNT_TYPE_ENUMS.EMPLOYER || !tenantId) { ... }

  req.body.tenantId = tenantId;

  const job = await jobService.create(req.body);

  return new ApiResponse({
    message: "Job created successfully.",
    statusCode: StatusCodes.CREATED,
    data: job,
    fieldName: "job",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const job = await jobService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Job updated.",
    statusCode: StatusCodes.OK,
    data: job,
    fieldName: "job",
  });
};

export const post = async ({ req }: ControllerParams) => {
  const job = await jobService.post({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job posted successfully.",
    statusCode: StatusCodes.OK,
    data: job,
    fieldName: "job",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await jobService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await jobService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const result = await jobService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job restored successfully.",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "job",
  });
};
