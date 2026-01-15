import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as documentFolderService from "./document-folder.service";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { DocumentAbilityBuilder, DocumentAuthZEntity } from "@rl/authz";
import { AbilityAction, USER_TYPE_ENUMS } from "@rl/types";

export const listDocumentFolder = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["name"],
  }).build();

  let query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const ability = new DocumentAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Read, DocumentAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} documentFolders.`
    );

  if (req.session.user.type === USER_TYPE_ENUMS.CUSTOMER) {
    query = { ...query, tenantId: req.session.tenantId, parentId: req.query.parent_id ? req.query.parent_id : null };
  }

  const results = await documentFolderService.listDocumentFolder({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Document and folders retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "documentFolders",
    pagination,
  });
};

export const getDocumentFolder = async ({ req }: ControllerParams) => {
  const documentFolder = await documentFolderService.getDocumentFolder(req.params.id);

  const ability = new DocumentAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Read, DocumentAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} documentFolder.`
    );

  return new ApiResponse({
    message: "Document and folder retrieved.",
    statusCode: StatusCodes.OK,
    data: documentFolder,
    fieldName: "documentFolder",
  });
};

export const updateDocumentFolder = async ({ req }: ControllerParams) => {
  const ability = new DocumentAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Update, DocumentAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} documentFolder.`
    );

  const documentFolder = await documentFolderService.updateDocumentFolder(req.params.id, req.body);

  return new ApiResponse({
    message: "Document and folder updated.",
    statusCode: StatusCodes.OK,
    data: documentFolder,
    fieldName: "documentFolder",
  });
};

export const createDocumentFolder = async ({ req }: ControllerParams) => {
  const ability = new DocumentAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Create, DocumentAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} documentFolder.`
    );

  const payload = { ...req.body, tenantId: null, createdBy: null };
  const documentFolder = await documentFolderService.createDocumentFolder(payload);

  return new ApiResponse({
    message: "Document and folder created.",
    statusCode: StatusCodes.CREATED,
    data: documentFolder,
    fieldName: "documentFolder",
  });
};

export const softRemoveDocumentFolder = async ({ req }: ControllerParams) => {
  const ability = new DocumentAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Delete, DocumentAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} documentFolder.`
    );

  const { documentFolder, deleted } = await documentFolderService.softRemoveDocumentFolder(req.params.id);

  return new ApiResponse({
    message: `${deleted} document and folder moved to trash.`,
    statusCode: StatusCodes.OK,
    data: documentFolder,
    fieldName: "documentFolder",
  });
};

export const hardRemoveDocumentFolder = async ({ req }: ControllerParams) => {
  const ability = new DocumentAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Delete, DocumentAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} documentFolder.`
    );

  const documentFolder = await documentFolderService.hardRemoveDocumentFolder(req.params.id);

  return new ApiResponse({
    message: "Document and folder removed.",
    statusCode: StatusCodes.OK,
    data: documentFolder,
    fieldName: "documentFolder",
  });
};

export const restoreDocumentFolder = async ({ req }: ControllerParams) => {
  const ability = new DocumentAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Update, DocumentAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} documentFolder.`
    );

  const { documentFolder, restored } = await documentFolderService.restoreDocumentFolder(req.params.id);

  return new ApiResponse({
    message: `${restored} document and folder restored.`,
    statusCode: StatusCodes.OK,
    data: documentFolder,
    fieldName: "documentFolder",
  });
};
