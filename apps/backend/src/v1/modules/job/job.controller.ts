import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import * as jobService from "./job.service";
import { JobAbilityBuilder, JobAuthZEntity, ALL_JOB_FIELDS } from "@rl/authz";
import { AbilityAction, JOBS_STATUS_ENUMS } from "@rl/types";
import { jobRoleScopedSecurityQuery } from "./job.query";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { agenda } from "../../../agenda/config";
import { JOB_NAME } from "../../../agenda/constants";
import { list as listApplications } from "../application/application.service";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_JOB_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single job document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedJobResponse = (doc: any, ability: any) => {
  return sanitizeDocument<JobAuthZEntity>(doc, ability, AbilityAction.Read, JobAuthZEntity, caslFieldOptions);
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, JobAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read jobs.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["title", "description", "company", "location"],
  }).build();

  const finalQuery = {
    $and: [filter.getFilterQuery(), jobRoleScopedSecurityQuery(ability)],
  };

  const results = await jobService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<JobAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    JobAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

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

  // Always authorize against the instance if it exists
  if (!job || !ability.can(AbilityAction.Read, new JobAuthZEntity(job))) {
    throw new UnauthorizedException("You do not have permission to view this job.");
  }

  return new ApiResponse({
    message: "Job retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedJobResponse(job, ability),
    fieldName: "job",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // General Create check
  if (!ability.can(AbilityAction.Create, JobAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create jobs.");
  }

  // Field-level check for creation payload
  validateUpdatePayload(req.body, ability, AbilityAction.Create, new JobAuthZEntity(req.body));

  const job = await jobService.create({
    payload: {
      ...req.body,
      tenantId: req.session.tenantId,
    },
  });

  if (job.endDate && job.status === JOBS_STATUS_ENUMS.OPEN) {
    await agenda.schedule(new Date(job.endDate), JOB_NAME.EXPIRE_JOB_POST, { jobId: job.id.toString() });
  }

  return new ApiResponse({
    message: "Job created successfully.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedJobResponse(job, ability),
    fieldName: "job",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // Fetch the data as it exists now
  const existingJob = await jobService.getOne({ query: { _id: req.params.id } });
  if (!existingJob) throw new NotFoundException("Job not found");

  const authZEntity = new JobAuthZEntity(existingJob);

  // Row-Level Check
  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException(`User is not authorized to update this job.`);
  }

  // Field-Level Check
  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const job = await jobService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  if (job.endDate && job.status === JOBS_STATUS_ENUMS.OPEN) {
    await agenda.schedule(new Date(job.endDate), JOB_NAME.EXPIRE_JOB_POST, { jobId: job._id.toString() });
  }

  return new ApiResponse({
    message: "Job updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedJobResponse(job, ability),
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

  const job = await jobService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job moved to trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedJobResponse(job, ability),
    fieldName: "job",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingJob = await jobService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingJob || !ability.can(AbilityAction.Update, new JobAuthZEntity(existingJob))) {
    throw new UnauthorizedException("You do not have permission to restore this job.");
  }

  const job = await jobService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job restored successfully.",
    statusCode: StatusCodes.OK,
    data: getSanitizedJobResponse(job, ability),
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

  const job = await jobService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Job permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedJobResponse(job, ability),
    fieldName: "job",
  });
};

export const allApplicationsForJob = async ({ req }: ControllerParams) => {
  const abilityBuilder = new JobAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const job = await jobService.getOne({
    query: { _id: req.params.id },
  });

  if (!job || !ability.can(AbilityAction.Read, new JobAuthZEntity(job))) {
    throw new UnauthorizedException("You do not have permission to view applications for this job.");
  }

  const results = await listApplications({
    query: { jobId: req.params.id },
    options: {
      sort: { createdAt: -1 },
    },
  });

  // todo: sanitize applications based on their own permissions

  // transform applications
  const { data, pagination } = formatListResponse({ ...results });

  return new ApiResponse({
    message: "Applications retrieved for the job.",
    statusCode: StatusCodes.OK,
    data: data,
    fieldName: "applications",
    pagination,
  });
};
