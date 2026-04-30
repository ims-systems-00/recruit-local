import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import * as jobProfileService from "./job-profile.service";
import * as applicationService from "../application/application.service";
import * as jobService from "../job/job.service";
import { update as updateUser } from "../user";
import {
  JobProfileAbilityBuilder,
  JobProfileAuthZEntity,
  ALL_JOB_PROFILE_FIELDS,
  JobAbilityBuilder,
  JobAuthZEntity,
} from "@rl/authz";
import { AbilityAction } from "@rl/types";
import { jobProfileRoleScopedSecurityQuery } from "./job-profile.query";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_PROFILE_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single job profile document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedResponse = (doc: any, ability: any) => {
  return sanitizeDocument<JobProfileAuthZEntity>(
    doc,
    ability,
    AbilityAction.Read,
    JobProfileAuthZEntity,
    caslFieldOptions
  );
};

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

  const results = await jobProfileService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<JobProfileAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    JobProfileAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Job Profiles retrieved",
    statusCode: StatusCodes.OK,
    data,
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

  if (!jobProfile || !ability.can(AbilityAction.Read, new JobProfileAuthZEntity(jobProfile))) {
    throw new UnauthorizedException("You do not have permission to view this job profile.");
  }

  return new ApiResponse({
    message: "Job Profile retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(jobProfile, ability),
    fieldName: "jobProfile",
  });
};

export const getAppliedJobs = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const jobProfile = await jobProfileService.getOne({
    query: { _id: req.params.id },
  });

  if (!jobProfile || !ability.can(AbilityAction.Read, new JobProfileAuthZEntity(jobProfile))) {
    throw new UnauthorizedException("You do not have permission to view this job profile.");
  }

  // Get all applications for this job profile
  const applications = await applicationService.list({
    query: { jobProfileId: req.params.id },
    options: {
      sort: { createdAt: -1 },
    },
  });

  // Extract unique job IDs from applications
  const applicationDocs = applications.docs as Array<{ jobId?: { toString(): string } | string }>;
  const jobIds = Array.from(new Set(applicationDocs.map((app) => app.jobId?.toString()).filter(Boolean)));

  if (jobIds.length === 0) {
    const { data, pagination } = formatListResponse({ ...applications, docs: [] });
    return new ApiResponse({
      message: "No applied jobs found.",
      statusCode: StatusCodes.OK,
      data,
      fieldName: "jobs",
      pagination,
    });
  }

  // Get the jobs with authorization check
  const jobs = await jobService.list({
    query: { _id: { $in: jobIds } } as unknown as Parameters<typeof jobService.list>[0]["query"],
    options: {
      sort: { createdAt: -1 },
    },
  });

  // Sanitize jobs based on job permissions
  const jobAbilityBuilder = new JobAbilityBuilder(req.session);
  const jobAbility = jobAbilityBuilder.getAbility();

  const caslJobFieldOptions = {
    fieldsFrom: (rule: { fields?: string[] }) => rule.fields || [],
  };

  const sanitizedJobs = sanitizeDocuments<JobAuthZEntity>(
    jobs.docs,
    jobAbility,
    AbilityAction.Read,
    JobAuthZEntity,
    caslJobFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...jobs, docs: sanitizedJobs });

  return new ApiResponse({
    message: "Applied jobs retrieved for the job profile.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "jobs",
    pagination,
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

  const results = await jobProfileService.listSoftDeleted({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<JobProfileAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    JobProfileAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Soft deleted job profiles retrieved",
    statusCode: StatusCodes.OK,
    data,
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

  if (!jobProfile || !ability.can(AbilityAction.Read, new JobProfileAuthZEntity(jobProfile))) {
    throw new UnauthorizedException("You do not have permission to view this deleted job profile.");
  }

  return new ApiResponse({
    message: "Deleted job profile retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(jobProfile, ability),
    fieldName: "jobProfile",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // General Create check
  if (!ability.can(AbilityAction.Create, JobProfileAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create a job profile.");
  }

  if (req.session.jobProfileId) {
    return new ApiResponse({ message: "User already has a job profile.", statusCode: StatusCodes.BAD_REQUEST });
  }

  // Field-level check for creation payload
  validateUpdatePayload(req.body, ability, AbilityAction.Create, new JobProfileAuthZEntity(req.body));

  req.body.userId = req.session.user?._id;

  const jobProfile = await jobProfileService.create({
    payload: req.body,
  });

  await updateUser({
    query: { _id: req.session.user?._id },
    payload: { jobProfileId: jobProfile._id },
  });

  return new ApiResponse({
    message: "Job Profile created.",
    statusCode: StatusCodes.CREATED,
    data: jobProfile,
    fieldName: "jobProfile",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOne({ query: { _id: req.params.id } });

  if (!existingJobProfile || !ability.can(AbilityAction.Update, new JobProfileAuthZEntity(existingJobProfile))) {
    throw new UnauthorizedException("You do not have permission to update this job profile.");
  }

  // Field-level payload validation
  validateUpdatePayload(req.body, ability, AbilityAction.Update, new JobProfileAuthZEntity(existingJobProfile));

  const jobProfile = await jobProfileService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Job Profile updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(jobProfile, ability),
    fieldName: "jobProfile",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOne({ query: { _id: req.params.id } });

  // Note: Using AbilityAction.SoftDelete to match the User controller conventions,
  // ensure your JobProfileAbilityBuilder uses SoftDelete as well.
  if (!existingJobProfile || !ability.can(AbilityAction.SoftDelete, new JobProfileAuthZEntity(existingJobProfile))) {
    throw new UnauthorizedException("You do not have permission to move this job profile to trash.");
  }

  const jobProfile = await jobProfileService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job profile moved to trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(jobProfile, ability),
    fieldName: "jobProfile",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingJobProfile || !ability.can(AbilityAction.HardDelete, new JobProfileAuthZEntity(existingJobProfile))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this job profile.");
  }

  const jobProfile = await jobProfileService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job Profile permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(jobProfile, ability),
    fieldName: "jobProfile",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobProfileAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJobProfile = await jobProfileService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingJobProfile || !ability.can(AbilityAction.Restore, new JobProfileAuthZEntity(existingJobProfile))) {
    throw new UnauthorizedException("You do not have permission to restore this job profile.");
  }

  const jobProfile = await jobProfileService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job profile restored from trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(jobProfile, ability),
    fieldName: "jobProfile",
  });
};
