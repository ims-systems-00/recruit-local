import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import * as jobProfileService from "./job-profile.service";
import { updateUser } from "../user";
import { Schema } from "mongoose";

export const list = async ({ req }: ControllerParams) => {
  // Fixed: Updated search fields to match JobProfile model
  const filter = new MongoQuery(req.query, {
    searchFields: ["headline", "summary"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await jobProfileService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Job Profiles retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "jobProfiles",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const jobProfile = await jobProfileService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job Profile retrieved.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  // Fixed: Updated search fields to match JobProfile model
  const filter = new MongoQuery(req.query, {
    searchFields: ["headline", "summary"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await jobProfileService.listSoftDeleted({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted job profiles retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "jobProfiles",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const jobProfile = await jobProfileService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Deleted job profile retrieved.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const jobProfile = await jobProfileService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Job Profile updated.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const userId = req.session.user?._id;
  req.body.userId = userId;

  // check if user already has a job profile
  if (req.session.jobProfileId) {
    return new ApiResponse({
      message: "User already has a job profile.",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

  // Updated to pass payload strictly as an object property
  const jobProfile = await jobProfileService.create({
    payload: req.body,
  });

  await updateUser(req.session.user?._id.toString(), {
    jobProfileId: jobProfile._id as Schema.Types.ObjectId,
  });

  return new ApiResponse({
    message: "Job Profile created.",
    statusCode: StatusCodes.CREATED,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  // Updated to call softDelete
  const jobProfile = await jobProfileService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job profile moved to trash.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  // Updated to call hardDelete
  const jobProfile = await jobProfileService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job Profile permanently deleted.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const jobProfile = await jobProfileService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job profile restored from trash.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};
