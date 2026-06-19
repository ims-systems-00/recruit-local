import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as formService from "./form.service";
import { ApiResponse, ControllerParams, formatListResponse } from "../../../../common/helper";

export const listForm = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(req.query, {
    searchFields: ["title"],
  }).build();

  const query = filter.getFilterQuery();
  const options = filter.getQueryOptions();

  const results = await formService.listForm({ query, options });
  const { data, pagination } = formatListResponse(results);

  return new ApiResponse({
    message: "Forms retrieved.",
    statusCode: StatusCodes.OK,
    data,
    fieldName: "forms",
    pagination,
  });
};

export const getForm = async ({ req }: ControllerParams) => {
  const form = await formService.getForm(req.params.id);

  return new ApiResponse({
    message: "Form retrieved.",
    statusCode: StatusCodes.OK,
    data: form,
    fieldName: "form",
  });
};

export const updateForm = async ({ req }: ControllerParams) => {
  const form = await formService.updateForm(req.params.id, req.body);

  return new ApiResponse({
    message: "Form updated.",
    statusCode: StatusCodes.OK,
    data: form,
    fieldName: "form",
  });
};

export const createForm = async ({ req }: ControllerParams) => {
  const payload = { ...req.body, tenantId: null };
  const form = await formService.createForm(payload);

  return new ApiResponse({
    message: "Form created.",
    statusCode: StatusCodes.CREATED,
    data: form,
    fieldName: "form",
  });
};

export const softRemoveForm = async ({ req }: ControllerParams) => {
  const { form, deleted } = await formService.softRemoveForm(req.params.id);

  return new ApiResponse({
    message: `${deleted} form moved to trash.`,
    statusCode: StatusCodes.OK,
    data: form,
    fieldName: "form",
  });
};

export const hardRemoveForm = async ({ req }: ControllerParams) => {
  const form = await formService.hardRemoveForm(req.params.id);

  return new ApiResponse({
    message: "Form removed.",
    statusCode: StatusCodes.OK,
    data: form,
    fieldName: "form",
  });
};

export const restoreForm = async ({ req }: ControllerParams) => {
  const { form, restored } = await formService.restoreForm(req.params.id);

  return new ApiResponse({
    message: `${restored} form restored.`,
    statusCode: StatusCodes.OK,
    data: form,
    fieldName: "form",
  });
};
