import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as jobService from "./job.service";
import { JobAbilityBuilder, JobAuthZEntity } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { jobRoleScopedSecurityQuery } from "./job.query";

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, JobAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read jobs.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "description", "company", "location"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const securityQuery = jobRoleScopedSecurityQuery(ability);

  const finalQuery = {
    $and: [userSearchQuery, securityQuery],
  };

  const results = await jobService.list({ query: finalQuery, options });
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
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const job = await jobService.getOne({
    query: { _id: req.params.id },
  });

  if (!job || !ability.can(AbilityAction.Read, new JobAuthZEntity(job))) {
    throw new UnauthorizedException("You do not have permission to view this job.");
  }

  return new ApiResponse({
    message: "Job retrieved.",
    statusCode: StatusCodes.OK,
    data: job,
    fieldName: "job",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, JobAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create jobs.");
  }

  req.body.tenantId = req.session.tenantId;

  const job = await jobService.create({
    payload: req.body,
  });

  return new ApiResponse({
    message: "Job created successfully.",
    statusCode: StatusCodes.CREATED,
    data: job,
    fieldName: "job",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJob = await jobService.getOne({ query: { _id: req.params.id } });

  if (!existingJob || !ability.can(AbilityAction.Update, new JobAuthZEntity(existingJob))) {
    throw new UnauthorizedException(`User is not authorized to update this job.`);
  }

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

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJob = await jobService.getOne({ query: { _id: req.params.id } });

  if (!existingJob || !ability.can(AbilityAction.Delete, new JobAuthZEntity(existingJob))) {
    throw new UnauthorizedException("You do not have permission to delete this job.");
  }

  await jobService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job moved to trash.",
    statusCode: StatusCodes.OK,
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJob = await jobService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingJob || !ability.can(AbilityAction.Update, new JobAuthZEntity(existingJob))) {
    throw new UnauthorizedException("You do not have permission to restore this job.");
  }

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

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJob = await jobService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingJob || !ability.can(AbilityAction.Delete, new JobAuthZEntity(existingJob))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this job.");
  }

  const result = await jobService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job permanently deleted.",
    statusCode: StatusCodes.OK,
    data: result,
    fieldName: "job",
  });
};
