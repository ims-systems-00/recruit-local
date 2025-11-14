import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as responseTemplateService from "./response-template.service";
import { ApiResponse, ControllerParams, formatListResponse, UnauthorizedException } from "../../../common/helper";
import { ResponseTemplateAbilityBuilder, ResponseTemplateAuthZEntity } from "@inrm/authz";
import { AbilityAction } from "@inrm/types";

export const listResponseTemplate = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["keyword", "fullText"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const ability = new ResponseTemplateAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Read, ResponseTemplateAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} response template.`
    );

  const results = await responseTemplateService.listResponseTemplate({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Response templates retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "responseTemplates",
    pagination,
  });
};

export const getResponseTemplate = async ({ req }: ControllerParams) => {
  const responseTemplate = await responseTemplateService.getResponseTemplate(req.params.id);
  const ability = new ResponseTemplateAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Read, ResponseTemplateAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Read} the response template.`
    );
  return new ApiResponse({
    message: "Response template retrieved.",
    statusCode: StatusCodes.OK,
    data: responseTemplate,
    fieldName: "responseTemplate",
  });
};

export const updateResponseTemplate = async ({ req }: ControllerParams) => {
  const ability = new ResponseTemplateAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Update, ResponseTemplateAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Update} the response template.`
    );
  const updatedResponseTemplate = await responseTemplateService.updateResponseTemplate(req.params.id, req.body);
  return new ApiResponse({
    message: "Response template updated.",
    statusCode: StatusCodes.OK,
    data: updatedResponseTemplate,
    fieldName: "responseTemplate",
  });
};

export const createResponseTemplate = async ({ req }: ControllerParams) => {
  const ability = new ResponseTemplateAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Create, ResponseTemplateAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Create} a response template.`
    );
  const responseTemplate = await responseTemplateService.createResponseTemplate({
    ...req.body,
    createdBy: req.session.user._id,
  });
  return new ApiResponse({
    message: "Response template created.",
    statusCode: StatusCodes.CREATED,
    data: responseTemplate,
    fieldName: "responseTemplate",
  });
};

export const softRemoveResponseTemplate = async ({ req }: ControllerParams) => {
  const ability = new ResponseTemplateAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Delete, ResponseTemplateAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} the response template.`
    );
  const { responseTemplate, deleted } = await responseTemplateService.softRemoveResponseTemplate(req.params.id);
  return new ApiResponse({
    message: `${deleted} Response template moved to trash.`,
    statusCode: StatusCodes.OK,
    data: responseTemplate,
    fieldName: "responseTemplate",
  });
};

export const hardRemoveResponseTemplate = async ({ req }: ControllerParams) => {
  const ability = new ResponseTemplateAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Delete, ResponseTemplateAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} the response template.`
    );
  const deletedResponseTemplate = await responseTemplateService.hardRemoveResponseTemplate(req.params.id);

  return new ApiResponse({
    message: "Response template removed.",
    statusCode: StatusCodes.OK,
    data: deletedResponseTemplate,
    fieldName: "responseTemplate",
  });
};

export const restoreResponseTemplate = async ({ req }: ControllerParams) => {
  const ability = new ResponseTemplateAbilityBuilder(req.session);
  if (!ability.getAbility().can(AbilityAction.Delete, ResponseTemplateAuthZEntity))
    throw new UnauthorizedException(
      `User ${req.session.user?._id} is not authorized to ${AbilityAction.Delete} the CoC request.`
    );
  const { responseTemplate, restored } = await responseTemplateService.restoreResponseTemplate(req.params.id);

  return new ApiResponse({
    message: `${restored} Response template restored.`,
    statusCode: StatusCodes.OK,
    data: responseTemplate,
    fieldName: "responseTemplate",
  });
};
