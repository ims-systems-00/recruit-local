import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { JobTitleAbilityBuilder, JobTitleAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as jobTitleService from "./job-title.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name", "description"],
  }).build();

  const query = { ...filter.getFilterQuery(), isActive: true };
  const options = filter.getQueryOptions();

  const results = await jobTitleService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Job titles retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "jobTitles",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const jobTitle = await jobTitleService.getOne({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Job title retrieved.",
    statusCode: StatusCodes.OK,
    data: jobTitle,
    fieldName: "jobTitle",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const ability = new JobTitleAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Create, JobTitleAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create job titles.");
  }

  const jobTitle = await jobTitleService.create(req.body);

  return new ApiResponse({
    message: "Job title created.",
    statusCode: StatusCodes.CREATED,
    data: jobTitle,
    fieldName: "jobTitle",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = new JobTitleAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Update, new JobTitleAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to update this job title.");
  }

  const jobTitle = await jobTitleService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Job title updated.",
    statusCode: StatusCodes.OK,
    data: jobTitle,
    fieldName: "jobTitle",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = new JobTitleAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.SoftDelete, new JobTitleAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to delete this job title.");
  }

  const jobTitle = await jobTitleService.softRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Job title moved to trash.",
    statusCode: StatusCodes.OK,
    data: jobTitle,
    fieldName: "jobTitle",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = new JobTitleAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.HardDelete, new JobTitleAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this job title.");
  }

  const jobTitle = await jobTitleService.hardRemove({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Job title permanently deleted.",
    statusCode: StatusCodes.OK,
    data: jobTitle,
    fieldName: "jobTitle",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = new JobTitleAbilityBuilder(req.session).getAbility();
  if (!ability.can(AbilityAction.Restore, new JobTitleAuthZEntity({ _id: req.params.id }))) {
    throw new UnauthorizedException("You are not authorized to restore this job title.");
  }

  const jobTitle = await jobTitleService.restore({ query: { _id: req.params.id } });

  return new ApiResponse({
    message: "Job title restored from trash.",
    statusCode: StatusCodes.OK,
    data: jobTitle,
    fieldName: "jobTitle",
  });
};

