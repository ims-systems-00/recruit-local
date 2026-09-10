import { StatusCodes } from "http-status-codes";
import * as formService from "./form.service";
import { ApiResponse, ControllerParams } from "../../../../common/helper";
import { runCursorList } from "../../../../common/query";
import { formListQuerySpec } from "./form.query";

export const listForm = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: formListQuerySpec,
    fetch: ({ query, options, offset }) => formService.listForm({ query, options, offset }),
    count: ({ query }) => formService.countForm({ query }),
  });

  return new ApiResponse({
    message: "Forms retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
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
