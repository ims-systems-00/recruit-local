import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import {
  ApiResponse,
  ControllerParams,
  formatListResponse,
  NotFoundException,
  UnauthorizedException,
} from "../../../common/helper";
import { ApplicationAbilityBuilder, ApplicationAuthZEntity, ALL_APPLICATION_FIELDS } from "@rl/authz";
import { AbilityAction } from "@rl/types";
import * as applicationService from "./application.service";
import * as jobService from "../job/job.service";
import { withTransaction } from "../../../common/helper/database-transaction";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { applicationRoleScopedSecurityQuery } from "./application.query";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_APPLICATION_FIELDS,
};

/**
 * Internal helper to keep the controller clean.
 * Sanitizes a single application document based on 'Read' permissions.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getSanitizedAppResponse = (doc: any, ability: any) => {
  return sanitizeDocument<ApplicationAuthZEntity>(
    doc,
    ability,
    AbilityAction.Read,
    ApplicationAuthZEntity,
    caslFieldOptions
  );
};

export const list = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  if (!ability.can(AbilityAction.Read, ApplicationAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read applications.`);
  }

  const filter = new MongoQuery(req.query, {
    searchFields: ["portfolioUrl", "coverLetter"],
  }).build();

  // Apply Role/Tenant Scoped Security Query
  const finalQuery = {
    $and: [filter.getFilterQuery(), applicationRoleScopedSecurityQuery(ability)],
  };

  const results = await applicationService.list({
    query: finalQuery,
    options: filter.getQueryOptions(),
  });

  const sanitizedDocs = sanitizeDocuments<ApplicationAuthZEntity>(
    results.docs,
    ability,
    AbilityAction.Read,
    ApplicationAuthZEntity,
    caslFieldOptions
  );

  const { data, pagination } = formatListResponse({ ...results, docs: sanitizedDocs });

  return new ApiResponse({
    message: "Applications retrieved",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "applications",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const application = await applicationService.getOne({
    query: { _id: req.params.id },
  });

  if (!application || !ability.can(AbilityAction.Read, new ApplicationAuthZEntity(application))) {
    throw new UnauthorizedException("You do not have permission to view this application.");
  }

  return new ApiResponse({
    message: "Application retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedAppResponse(application, ability),
    fieldName: "application",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingApplication = await applicationService.getOne({ query: { _id: req.params.id } });
  if (!existingApplication) throw new NotFoundException("Application not found");

  const authZEntity = new ApplicationAuthZEntity(existingApplication);

  // Row-Level Check
  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException(`User is not authorized to update this application.`);
  }

  // Field-Level Check
  validateUpdatePayload(req.body, ability, AbilityAction.Update, authZEntity);

  const application = await applicationService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Application updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedAppResponse(application, ability),
    fieldName: "application",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  // General Create check
  if (!ability.can(AbilityAction.Create, ApplicationAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create applications.");
  }

  // Field-level check for creation payload
  validateUpdatePayload(req.body, ability, AbilityAction.Create, new ApplicationAuthZEntity(req.body));

  return withTransaction(async (session) => {
    const application = await applicationService.create({
      payload: {
        ...req.body,
        tenantId: req.session.tenantId,
      },
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
      data: getSanitizedAppResponse(application, ability),
      fieldName: "application",
    });
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingApplication = await applicationService.getOne({ query: { _id: req.params.id } });

  if (!existingApplication || !ability.can(AbilityAction.Delete, new ApplicationAuthZEntity(existingApplication))) {
    throw new UnauthorizedException("You do not have permission to delete this application.");
  }

  return withTransaction(async (session) => {
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
      data: {
        application: getSanitizedAppResponse(application, ability),
        deleted,
      },
      fieldName: "application",
    });
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingApplication = await applicationService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingApplication || !ability.can(AbilityAction.Update, new ApplicationAuthZEntity(existingApplication))) {
    throw new UnauthorizedException("You do not have permission to restore this application.");
  }

  const { application, restored } = await applicationService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Application restored.",
    statusCode: StatusCodes.OK,
    data: {
      application: getSanitizedAppResponse(application, ability),
      restored,
    },
    fieldName: "application",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingApplication = await applicationService.getOneSoftDeleted({ query: { _id: req.params.id } });

  if (!existingApplication || !ability.can(AbilityAction.Delete, new ApplicationAuthZEntity(existingApplication))) {
    throw new UnauthorizedException("You do not have permission to permanently delete this application.");
  }

  const application = await applicationService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Application permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedAppResponse(application, ability),
    fieldName: "application",
  });
};

export const statusUpdate = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingApplication = await applicationService.getOne({ query: { _id: req.params.id } });
  if (!existingApplication) throw new NotFoundException("Application not found");

  const authZEntity = new ApplicationAuthZEntity(existingApplication);

  if (!ability.can(AbilityAction.Update, authZEntity)) {
    throw new UnauthorizedException("User is not authorized to update this application's status.");
  }

  // Validate the status field specifically
  validateUpdatePayload({ status: req.body.status }, ability, AbilityAction.Update, authZEntity);

  const application = await applicationService.statusUpdate({
    query: { _id: req.params.id },
    status: req.body.status,
  });

  return new ApiResponse({
    message: "Application status updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedAppResponse(application, ability),
    fieldName: "application",
  });
};

export const moveItemOnBoard = async ({ req }: ControllerParams) => {
  const abilityBuilder = new ApplicationAbilityBuilder(req.session);
  const ability = abilityBuilder.getAbility();

  const existingApplication = await applicationService.getOne({ query: { _id: req.params.id } });
  if (!existingApplication) throw new NotFoundException("Application not found");

  if (!ability.can(AbilityAction.Update, new ApplicationAuthZEntity(existingApplication))) {
    throw new UnauthorizedException("User is not authorized to move this application on the board.");
  }

  const application = await applicationService.moveItemOnBoard({
    itemId: req.params.id,
    targetStatusId: req.body.targetStatusId,
    targetIndex: req.body.targetIndex,
  });

  return new ApiResponse({
    message: "Application moved on board.",
    statusCode: StatusCodes.OK,
    data: getSanitizedAppResponse(application, ability),
    fieldName: "application",
  });
};
