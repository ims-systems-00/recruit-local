import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { UserAbilityBuilder, UserAuthZEntity } from "@inrm/authz";
import { AbilityAction, ACCOUNT_TYPE_ENUMS } from "@inrm/types";
import * as jobProfileService from "./job-profile.service";

export const listJobProfile = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "description"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} job profiles.`
  //     );

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

export const getJobProfile = async ({ req }: ControllerParams) => {
  const jobProfile = await jobProfileService.getOne(req.params.id);

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Read, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} job profile.`
  //     );

  return new ApiResponse({
    message: "Job Profile retrieved.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const updateJobProfile = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Update, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} job profile.`
  //     );

  const jobProfile = await jobProfileService.update(req.params.id, req.body);

  return new ApiResponse({
    message: "Job Profile updated.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const createJobProfile = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Create, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} job profile.`
  //     );
  const userId = req.session.user?.id;
  req.body.userId = userId;
  const jobProfile = await jobProfileService.create(req.body);

  return new ApiResponse({
    message: "Job Profile created.",
    statusCode: StatusCodes.CREATED,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const softRemoveJobProfile = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Delete, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} job profile.`
  //     );

  const { jobProfile, deleted } = await jobProfileService.softRemove(req.params.id);
  return new ApiResponse({
    message: `${deleted} job profile moved to trash.`,
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const hardRemoveJobProfile = async ({ req }: ControllerParams) => {
  //   const existingJobProfile = await jobProfileService.getOne(req.params.id);

  //   const ability = new UserAbilityBuilder(req.session);
  //   if (
  //     !ability.getAbility().can(
  //       AbilityAction.Delete,
  //       new UserAuthZEntity({ ownerId: existingJobProfile.userId.toString() })
  //     )
  //   )
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} job profile.`
  //     );

  const jobProfile = await jobProfileService.hardRemove(req.params.id);

  return new ApiResponse({
    message: "Job Profile permanently deleted.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const restoreJobProfile = async ({ req }: ControllerParams) => {
  //   const ability = new UserAbilityBuilder(req.session);
  //   if (!ability.getAbility().can(AbilityAction.Restore, UserAuthZEntity))
  //     throw new UnauthorizedException(
  //       `User ${req.session.user?._id} is not authorized to ${AbilityAction.Restore} job profile.`
  //     );

  const { jobProfile, restored } = await jobProfileService.restore(req.params.id);

  return new ApiResponse({
    message: `${restored} job profile restored from trash.`,
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};
