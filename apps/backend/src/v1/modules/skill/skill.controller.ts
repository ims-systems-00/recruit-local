import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as skillService from "./skill.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await skillService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Skills retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "skills",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const skill = await skillService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill retrieved.",
    statusCode: StatusCodes.OK,
    data: skill,
    fieldName: "skill",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await skillService.listSoftDeleted({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted skills retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "skills",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const skill = await skillService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted skill retrieved.",
    statusCode: StatusCodes.OK,
    data: skill,
    fieldName: "skill",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;

  const skill = await skillService.create({
    ...req.body,
    userId: userId!,
  });

  return new ApiResponse({
    message: "Skill created.",
    statusCode: StatusCodes.CREATED,
    data: skill,
    fieldName: "skill",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const skill = await skillService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Skill updated.",
    statusCode: StatusCodes.OK,
    data: skill,
    fieldName: "skill",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  await skillService.softRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  await skillService.hardRemove({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill permanently deleted.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const result = await skillService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Skill restored from trash.",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "skill",
  });
};
