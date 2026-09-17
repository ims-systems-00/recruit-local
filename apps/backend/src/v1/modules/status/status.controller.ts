import { StatusCodes } from "http-status-codes";
import { AnyAbility } from "@casl/ability";
import { AbilityAction, ISession } from "@rl/types";
import { ALL_STATUS_FIELDS, StatusAbilityBuilder, StatusAuthZEntity } from "@rl/authz";
import { ApiResponse, ControllerParams, UnauthorizedException } from "../../../common/helper";
import { sanitizeDocument, sanitizeDocuments, validateUpdatePayload } from "../../../common/helper/authz";
import { runCursorList } from "../../../common/query";
import { statusListQuerySpec, statusRoleScopedSecurityQuery } from "./status.query";
import * as statusService from "./status.service";
import { toStatusResponse, toStatusResponseList } from "./status.dto";
import { IStatusDoc } from "../../../models";

const caslFieldOptions = {
  fieldsFrom: (rule: { fields?: string[] }) => rule.fields || ALL_STATUS_FIELDS,
};

const getAbility = (session: ISession) => new StatusAbilityBuilder(session).getAbility();

const getSanitizedResponse = (doc: IStatusDoc, ability: AnyAbility) =>
  toStatusResponse(sanitizeDocument<IStatusDoc>(doc, ability, AbilityAction.Read, StatusAuthZEntity, caslFieldOptions));

export const list = async ({ req }: ControllerParams) => {
  const ability = getAbility(req.session);

  if (!ability.can(AbilityAction.Read, StatusAuthZEntity)) {
    throw new UnauthorizedException(`User ${req.session.user?._id} is not authorized to read statuses.`);
  }

  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: statusListQuerySpec,
    securityQuery: statusRoleScopedSecurityQuery(ability),
    fetch: ({ query, options, offset }) => statusService.list({ query, options, offset }),
  });

  // After the cursor is built: field stripping can drop the field it keys on.
  const sanitizedDocs = sanitizeDocuments<IStatusDoc>(
    docs,
    ability,
    AbilityAction.Read,
    StatusAuthZEntity,
    caslFieldOptions
  );

  return new ApiResponse({
    message: "Statuses retrieved.",
    statusCode: StatusCodes.OK,
    data: toStatusResponseList(sanitizedDocs),
    fieldName: "statuses",
    pagination,
  });
};

export const get = async ({ req }: ControllerParams) => {
  const ability = getAbility(req.session);

  const status = await statusService.getOne({
    query: { _id: req.params.id },
  });

  if (!ability.can(AbilityAction.Read, new StatusAuthZEntity(status))) {
    throw new UnauthorizedException("You do not have permission to view this status.");
  }

  return new ApiResponse({
    message: "Status retrieved.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(status, ability),
    fieldName: "status",
  });
};

export const create = async ({ req }: ControllerParams) => {
  const ability = getAbility(req.session);

  if (!ability.can(AbilityAction.Create, StatusAuthZEntity)) {
    throw new UnauthorizedException("You are not authorized to create statuses.");
  }

  // The status belongs to the tenant that owns its board, not to whoever sends
  // the request — so a status can only be added to a board the caller owns.
  const tenantId = await statusService.getBoardTenantId(req.body.collectionName, req.body.collectionId);
  const entity = new StatusAuthZEntity({ tenantId });

  if (!ability.can(AbilityAction.Create, entity)) {
    throw new UnauthorizedException("You are not authorized to add statuses to this board.");
  }
  validateUpdatePayload(req.body, ability, AbilityAction.Create, entity);

  const status = await statusService.create({
    payload: { ...req.body, tenantId },
  });

  return new ApiResponse({
    message: "Status created.",
    statusCode: StatusCodes.CREATED,
    data: getSanitizedResponse(status, ability),
    fieldName: "status",
  });
};

export const update = async ({ req }: ControllerParams) => {
  const ability = getAbility(req.session);

  const existing = await statusService.getOne({
    query: { _id: req.params.id },
  });
  const entity = new StatusAuthZEntity(existing);

  if (!ability.can(AbilityAction.Update, entity)) {
    throw new UnauthorizedException("You are not authorized to update this status.");
  }
  validateUpdatePayload(req.body, ability, AbilityAction.Update, entity);

  const status = await statusService.update({
    query: { _id: req.params.id },
    payload: req.body,
  });

  return new ApiResponse({
    message: "Status updated.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(status, ability),
    fieldName: "status",
  });
};

export const reorder = async ({ req }: ControllerParams) => {
  const ability = getAbility(req.session);

  const tenantId = await statusService.getBoardTenantId(req.body.collectionName, req.body.collectionId);

  if (!ability.can(AbilityAction.Update, new StatusAuthZEntity({ tenantId }), "weight")) {
    throw new UnauthorizedException("You are not authorized to reorder this board.");
  }

  const statuses = await statusService.reorder({
    collectionName: req.body.collectionName,
    collectionId: req.body.collectionId,
    statusIds: req.body.statusIds,
  });

  return new ApiResponse({
    message: "Statuses reordered.",
    statusCode: StatusCodes.OK,
    data: statuses.map((status) => getSanitizedResponse(status, ability)),
    fieldName: "statuses",
  });
};

export const softRemove = async ({ req }: ControllerParams) => {
  const ability = getAbility(req.session);

  const existing = await statusService.getOne({
    query: { _id: req.params.id },
  });

  if (!ability.can(AbilityAction.SoftDelete, new StatusAuthZEntity(existing))) {
    throw new UnauthorizedException("You are not authorized to delete this status.");
  }

  const status = await statusService.softDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status moved to trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(status, ability),
    fieldName: "status",
  });
};

export const hardRemove = async ({ req }: ControllerParams) => {
  const ability = getAbility(req.session);

  // Hard delete only acts on a status already in the trash.
  const existing = await statusService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  if (!ability.can(AbilityAction.HardDelete, new StatusAuthZEntity(existing))) {
    throw new UnauthorizedException("You are not authorized to permanently delete this status.");
  }

  const status = await statusService.hardDelete({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status permanently deleted.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(status, ability),
    fieldName: "status",
  });
};

export const restore = async ({ req }: ControllerParams) => {
  const ability = getAbility(req.session);

  const existing = await statusService.getOneSoftDeleted({
    query: { _id: req.params.id },
  });

  if (!ability.can(AbilityAction.Restore, new StatusAuthZEntity(existing))) {
    throw new UnauthorizedException("You are not authorized to restore this status.");
  }

  const status = await statusService.restore({
    query: { _id: req.params.id },
  });

  return new ApiResponse({
    message: "Status restored from trash.",
    statusCode: StatusCodes.OK,
    data: getSanitizedResponse(status, ability),
    fieldName: "status",
  });
};
