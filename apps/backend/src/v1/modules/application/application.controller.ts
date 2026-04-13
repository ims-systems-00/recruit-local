import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@rl/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@rl/types";
import * as applicationService from "./application.service";
import * as jobService from "../job/job.service";
import { withTransaction } from "../../../common/helper/database-transaction";

export const list = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: [],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} applications.`
  //     );

  // This already perfectly matches the { query, options } pattern!
  const results = await applicationService.list({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Applications retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "applications",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} application.`
  //     );

  // Updated to use the object parameter
  const application = await applicationService.getOne({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Application retrieved.",
    statusCode: StatusCodes.OK,
    data: application,
    fieldName: "application",
  });
};

export const update = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} application.`
  //     );

  // Updated to pass query and payload as properties of a single object
  const application = await applicationService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Application updated.",
    statusCode: StatusCodes.OK,
    data: application,
    fieldName: "application",
  });
};

export const create = async ({ req }: ControllerParams) => {
  return withTransaction(async (session) => {
    //   const ability = new UserAbilityBuilder(req.session);
    //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
    //     throw new UnauthorizedException(
    //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} application.`
    //     );

    // Updated to pass payload inside the object parameter
    const application = await applicationService.create({
      payload: req.body,
      session,
    });
    await jobService.incrementStats({
      query: { _id: application.jobId!.toString() } as any,
      payload: { totalApplications: 1 },
      session,
    });

    return new ApiResponse({
      message: "Application created.",
      statusCode: StatusCodes.CREATED,
      data: application,
      fieldName: "application",
    });
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  return withTransaction(async (session) => {
    //   const ability = new UserAbilityBuilder(req.session);
    //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
    //     throw new UnauthorizedException(
    //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} application.`
    //     );

    // Updated to call softDelete and handle the destructured return
    const { application, deleted } = await applicationService.softDelete({
      query: { _id: req.params.id },
      session,
    });
    await jobService.incrementStats({
      query: { _id: application.jobId!.toString() } as any,
      payload: { totalApplications: -1 },
      session,
    });

    return new ApiResponse({
      message: "Application deleted.",
      statusCode: StatusCodes.OK,
      data: { application, deleted },
      fieldName: "application",
    });
  });
};

export const restore = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Restore, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Restore} application.`
  //     );

  // Updated to call restore using object parameters
  const { application, restored } = await applicationService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Application restored.",
    statusCode: StatusCodes.OK,
    data: { application, restored },
    fieldName: "application",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.HardDelete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.HardDelete} application.`
  //     );

  // Updated to call hardRemove
  const application = await applicationService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Application permanently deleted.",
    statusCode: StatusCodes.OK,
    data: application,
    fieldName: "application",
  });
};

export const statusUpdate = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} application.`
  //     );

  // Updated to use the new object parameter signature
  const application = await applicationService.statusUpdate({
    query: { _id: req.params.id },
    status: req.body.status,
  });

  return new ApiResponse({
    message: "Application status updated.",
    statusCode: StatusCodes.OK,
    data: application,
    fieldName: "application",
  });
};

export const moveItemOnBoard = async ({ req }: ControllerParams) => {
  // Updated to strictly map to IMoveBoardItemParams
  const application = await applicationService.moveItemOnBoard({
    itemId: req.params.id,
    targetStatusId: req.body.targetStatusId,
    targetIndex: req.body.targetIndex,
  });

  return new ApiResponse({
    message: "Application moved on board.",
    statusCode: StatusCodes.OK,
    data: application,
    fieldName: "application",
  });
};
