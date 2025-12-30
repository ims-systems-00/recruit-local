import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@inrm/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@inrm/types";

import * as jobService from "./job.service";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "company", "location"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} jobs.`
  //     );

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
  const job = await jobService.getOne(req.params.id);

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} job.`
  //     );

  return new ApiResponse({
    message: "Job retrieved.",
    statusCode: StatusCodes.OK,
    data: job,
    fieldName: "job",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} job.`
  //     );

  const job = await jobService.update(req.params.id, req.body);

  return new ApiResponse({
    message: "Job updated.",
    statusCode: StatusCodes.OK,
    data: job,
    fieldName: "job",
  });
};

export const create = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} job.`
  //     );
  const tenantId = req.session.tenantId;
  // if (req.session.user.type !== ACCOUNT_TYPE_ENUMS.EMPLOYER || !tenantId) {
  //   throw new UnauthorizedException(`You are not authorized to create a job.`);
  // }
  req.body.tenantId = tenantId;
  const job = await jobService.create(req.body);

  return new ApiResponse({
    message: "Job created successfully.",
    statusCode: StatusCodes.CREATED,
    data: job,
    fieldName: "job",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} job.`
  //     );

  await jobService.softRemove(req.params.id);

  return new ApiResponse({
    message: "Job removed successfully.",
    statusCode: StatusCodes.OK,
    data: null,
    fieldName: "job",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} job.`
  //     );

  await jobService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "Job permanently deleted successfully.",
    statusCode: StatusCodes.OK,
    data: null,
    fieldName: "job",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} job.`
  //     );

  const job = await jobService.restore(req.params.id);

  return new ApiResponse({
    message: "Job restored successfully.",
    statusCode: StatusCodes.OK,
    data: job,
    fieldName: "job",
  });
};
