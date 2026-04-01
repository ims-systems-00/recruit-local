import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as jobProfileService from "./job-profile.service";
import { updateUser } from "../user";
import { Schema } from "mongoose";
import { JobProfileAbilityBuilder, JobProfileAuthZEntity, ALL_JOB_PROFILE_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { jobProfileRoleScopedSecurityQuery } from "./job-profile.query";
import { permittedFieldsOf } from "@casl/ability/extra";

const caslFieldOptions = { fieldsFrom: (rule: any) => rule.fields || ALL_JOB_PROFILE_FIELDS };

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, JobProfileAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read job profiles.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["headline", "summary"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), jobProfileRoleScopedSecurityQuery(ability)],
  };

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);
  const results = await jobProfileService.list({ query: finalQuery, options: filter.getQueryOptions(), allowedFields });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Job Profiles retrieved",
    statusCode: StatusCodes.OK,
    data: data,
    fieldName: "jobProfiles",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);

  const jobProfile = await jobProfileService.getOne({
    query: { _id: req.params.id },
    allowedFields,
  });

  const authZEntity = new JobProfileAuthZEntity({
    _id: jobProfile?._id.toString() ?? null,
    status: jobProfile?.status,
    visibility: jobProfile?.visibility,
  });

  if (!jobProfile || !ability.can(AbilityAction.Read, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to view this job profile.");
  }

  return new ApiResponse({
    message: "Job Profile retrieved.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, JobProfileAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read deleted job profiles.");
  }

  const filter = new MongoQuery(req.query, { searchFields: ["headline", "summary"] }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), jobProfileRoleScopedSecurityQuery(ability)],
  };

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);

  const results = await jobProfileService.listSoftDeleted({
    query: finalQuery,
    options: filter.getQueryOptions(),
    allowedFields,
  });

  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Soft deleted job profiles retrieved",
    statusCode: StatusCodes.OK,
    data: data,
    fieldName: "jobProfiles",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);

  const jobProfile = await jobProfileService.getOneSoftDeleted({
    query: { _id: req.params.id },
    allowedFields,
  });

  const authZEntity = new JobProfileAuthZEntity({
    _id: jobProfile?._id.toString() ?? null,
    status: jobProfile?.status,
    visibility: jobProfile?.visibility,
  });

  if (!jobProfile || !ability.can(AbilityAction.Read, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to view this deleted job profile.");
  }

  return new ApiResponse({
    message: "Deleted job profile retrieved.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOne({ query: { _id: req.params.id } });

  const authZEntity = new JobProfileAuthZEntity({
    _id: existingJobProfile?._id.toString() ?? null,
    status: existingJobProfile?.status,
    visibility: existingJobProfile?.visibility,
  });

  if (!existingJobProfile || !ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("User is not authorized to update this job profile.");
  }

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);

  const jobProfile = await jobProfileService.update({
    query: { _id: req.params.id },
    payload: req.body,
    allowedFields,
  });

  return new ApiResponse({
    message: "Job Profile updated.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Create, JobProfileAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create a job profile.");
  }

  req.body.userId = req.session.user?._id;

  if (req.session.jobProfileId) {
    return new ApiResponse({ message: "User already has a job profile.", statusCode: StatusCodes.BAD_REQUEST });
  }

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);

  const jobProfile = await jobProfileService.create({
    payload: req.body,
    allowedFields,
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
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOne({ query: { _id: req.params.id } });

  const authZEntity = new JobProfileAuthZEntity({
    _id: existingJobProfile?._id.toString() ?? null,
    status: existingJobProfile?.status,
    visibility: existingJobProfile?.visibility,
  });

  if (!existingJobProfile || !ability.can(AbilityAction.Delete, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to move this job profile to trash.");
  }

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);

  const jobProfile = await jobProfileService.softDelete({
    query: { _id: req.params.id },
    allowedFields,
  });

  return new ApiResponse({
    message: "Job profile moved to trash.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOneSoftDeleted({ query: { _id: req.params.id } });

  const authZEntity = new JobProfileAuthZEntity({
    _id: existingJobProfile?._id.toString() ?? null,
    status: existingJobProfile?.status,
    visibility: existingJobProfile?.visibility,
  });

  if (!existingJobProfile || !ability.can(AbilityAction.Delete, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to permanently delete this job profile.");
  }

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);

  const jobProfile = await jobProfileService.hardDelete({
    query: { _id: req.params.id },
    allowedFields,
  });

  return new ApiResponse({
    message: "Job Profile permanently deleted.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOneSoftDeleted({ query: { _id: req.params.id } });

  const authZEntity = new JobProfileAuthZEntity({
    _id: existingJobProfile?._id.toString() ?? null,
    status: existingJobProfile?.status,
    visibility: existingJobProfile?.visibility,
  });

  if (!existingJobProfile || !ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to restore this job profile.");
  }

  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, JobProfileAuthZEntity, caslFieldOptions);

  const jobProfile = await jobProfileService.restore({
    query: { _id: req.params.id },
    allowedFields,
  });

  return new ApiResponse({
    message: "Job profile restored from trash.",
    statusCode: StatusCodes.OK,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};
