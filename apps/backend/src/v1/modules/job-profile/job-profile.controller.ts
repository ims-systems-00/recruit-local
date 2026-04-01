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
import pick from "lodash/pick";
import { IJobProfileDoc } from "../../../models";

// Defines the options for CASL to extract permitted fields.
const caslFieldOptions = { fieldsFrom: (rule) => rule.fields || ALL_JOB_PROFILE_FIELDS };

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Broad Check: Can this user read job profiles in general?
  if (!ability.can(AbilityAction.Read, JobProfileAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read job profiles.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["headline", "summary"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  // Apply row-level security: only fetch profiles this user is allowed to see (e.g., only verified profiles for employers)
  const securityQuery = jobProfileRoleScopedSecurityQuery(ability);

  const finalQuery = {
    $and: [userSearchQuery, securityQuery],
  };

  const results = await jobProfileService.list({ query: finalQuery, options });
  const { data, pagination } = formatListResponse(results);

  //  Field-Level Security (Sanitization)
  // Iterate over each document and strip out fields the user isn't allowed to see (like kycDocumentId for Employers)
  const safeData = data.map((profile: IJobProfileDoc) => {
    const authZEntity = new JobProfileAuthZEntity({
      _id: profile._id.toString(),
      status: profile.status,
      visibility: profile.visibility,
    });
    const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
    return pick(profile.toJSON ? profile.toJSON() : profile, allowedFields);
  });

  return new ApiResponse({
    message: "Job Profiles retrieved",
    statusCode: StatusCodes.OK,
    data: safeData,
    fieldName: "jobProfiles",
    pagination,
  });
};

export const getOne = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const jobProfile = await jobProfileService.getOne({
    query: { _id: req.params.id },
  });

  const authZEntity = new JobProfileAuthZEntity({
    _id: jobProfile?._id.toString() ?? null,
    status: jobProfile?.status,
    visibility: jobProfile?.visibility,
  });
  if (!jobProfile || !ability.can(AbilityAction.Read, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to view this job profile.");
  }

  // Field-Level Security: Get the array of fields this user is allowed to read on this specific profile
  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);

  // Convert Mongoose doc to plain JSON, then pick only the allowed fields
  const safeJobProfile = pick(jobProfile.toJSON(), allowedFields);

  return new ApiResponse({
    message: "Job Profile retrieved.",
    statusCode: StatusCodes.OK,
    data: safeJobProfile,
    fieldName: "jobProfile",
  });
};

export const listSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  //  Broad Check: Can this user read deleted job profiles? (Typically only Admins)
  if (!ability.can(AbilityAction.Read, JobProfileAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to read deleted job profiles.");
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["headline", "summary"],
  }).build();

  const userSearchQuery = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const securityQuery = jobProfileRoleScopedSecurityQuery(ability);

  const finalQuery = {
    $and: [userSearchQuery, securityQuery],
  };

  const results = await jobProfileService.listSoftDeleted({ query: finalQuery, options });
  const { data, pagination } = formatListResponse(results);

  //  Field-Level Security (Sanitization) for deleted items
  const safeData = data.map((profile: IJobProfileDoc) => {
    const authZEntity = new JobProfileAuthZEntity({
      _id: profile._id.toString(),
      status: profile.status,
      visibility: profile.visibility,
    });
    const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
    return pick(profile.toJSON ? profile.toJSON() : profile, allowedFields);
  });

  return new ApiResponse({
    message: "Soft deleted job profiles retrieved",
    statusCode: StatusCodes.OK,
    data: safeData,
    fieldName: "jobProfiles",
    pagination,
  });
};

export const getOneSoftDeleted = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const jobProfile = await jobProfileService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  const authZEntity = new JobProfileAuthZEntity({
    _id: jobProfile?._id.toString() ?? null,
    status: jobProfile?.status,
    visibility: jobProfile?.visibility,
  });
  if (!jobProfile || !ability.can(AbilityAction.Read, authZEntity)) {
    throw new UnauthorizedException("You do not have permission to view this deleted job profile.");
  }

  //  Field-Level Security: Ensure we don't leak restricted fields even on deleted documents
  const allowedFields = permittedFieldsOf(ability, AbilityAction.Read, authZEntity, caslFieldOptions);
  const safeJobProfile = pick(jobProfile.toJSON(), allowedFields);

  return new ApiResponse({
    message: "Deleted job profile retrieved.",
    statusCode: StatusCodes.OK,
    data: safeJobProfile,
    fieldName: "jobProfile",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Fetch first to check ownership properties
  const existingJobProfile = await jobProfileService.getOne({
    query: { _id: req.params.id },
  });

  // Instance Check: Is the user allowed to update this specific profile? (E.g., Are they the owner?)
  if (
    !existingJobProfile ||
    !ability.can(
      AbilityAction.Update,
      new JobProfileAuthZEntity({
        _id: existingJobProfile._id.toString(),
        status: existingJobProfile.status,
        visibility: existingJobProfile.visibility,
      })
    )
  ) {
    throw new UnauthorizedException("User is not authorized to update this job profile.");
  }

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
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Broad Check: Is the user role allowed to create a job profile?
  if (!ability.can(AbilityAction.Create, JobProfileAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create a job profile.");
  }

  const userId = req.session.user?._id;
  req.body.userId = userId;

  // Check if user already has a job profile
  if (req.session.jobProfileId) {
    return new ApiResponse({
      message: "User already has a job profile.",
      statusCode: StatusCodes.BAD_REQUEST,
    });
  }

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
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOne({
    query: { _id: req.params.id },
  });

  // Instance Check: Is the user allowed to delete this specific profile?
  if (
    !existingJobProfile ||
    !ability.can(
      AbilityAction.Delete,
      new JobProfileAuthZEntity({
        _id: existingJobProfile._id.toString(),
        status: existingJobProfile.status,
        visibility: existingJobProfile.visibility,
      })
    )
  ) {
    throw new UnauthorizedException("You do not have permission to move this job profile to trash.");
  }

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
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Fetching from trash to ensure we have the entity data for CASL ownership checks
  const existingJobProfile = await jobProfileService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  // Instance Check: Is the user allowed to permanently delete this?
  if (
    !existingJobProfile ||
    !ability.can(
      AbilityAction.Delete,
      new JobProfileAuthZEntity({
        _id: existingJobProfile._id.toString(),
        status: existingJobProfile.status,
        visibility: existingJobProfile.visibility,
      })
    )
  ) {
    throw new UnauthorizedException("You do not have permission to permanently delete this job profile.");
  }

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
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  // Instance Check: Is the user allowed to restore this profile? (Typically requires Update permissions)
  if (
    !existingJobProfile ||
    !ability.can(
      AbilityAction.Update,
      new JobProfileAuthZEntity({
        _id: existingJobProfile._id.toString(),
        status: existingJobProfile.status,
        visibility: existingJobProfile.visibility,
      })
    )
  ) {
    throw new UnauthorizedException("You do not have permission to restore this job profile.");
  }

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
