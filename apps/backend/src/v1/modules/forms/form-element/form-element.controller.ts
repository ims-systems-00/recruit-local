import { StatusCodes } from "http-status-codes";
import * as formElementService from "./form-element.service";
import { ApiResponse, ControllerParams } from "../../../../common/helper";
import { runCursorList } from "../../../../common/query";
import { formElementListQuerySpec } from "./form-element.query";

export const listFormElement = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: formElementListQuerySpec,
    // The sequence order is built by $graphLookup, not stored on a field, so
    // there is nothing to key on — the cursor carries a $skip instead.
    useKeyset: false,
    extraConditions: [{ formId: req.params.formId }],
    fetch: ({ query, options, offset }) => formElementService.listFormElement({ query, options, offset }),
  });

  return new ApiResponse({
    message: "FormElements retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "formElements",
    pagination,
  });
};

export const getFormElement = async ({ req }: ControllerParams) => {
  const formElement = await formElementService.getFormElement(req.params.id);

  return new ApiResponse({
    message: "FormElement retrieved.",
    statusCode: StatusCodes.OK,
    data: formElement,
    fieldName: "formElement",
  });
};

export const updateFormElement = async ({ req }: ControllerParams) => {
  const formElement = await formElementService.updateFormElement(req.params.id, req.body);

  return new ApiResponse({
    message: "FormElement updated.",
    statusCode: StatusCodes.OK,
    data: formElement,
    fieldName: "formElement",
  });
};

export const createFormElement = async ({ req }: ControllerParams) => {
  const payload = { ...req.body, formId: req.params.formId, tenantId: null };
  const formElement = await formElementService.createFormElement(payload);

  return new ApiResponse({
    message: "FormElement created.",
    statusCode: StatusCodes.CREATED,
    data: formElement,
    fieldName: "formElement",
  });
};

export const hardRemoveFormElement = async ({ req }: ControllerParams) => {
  const formElement = await formElementService.hardRemoveFormElement(req.params.id);

  return new ApiResponse({
    message: "FormElement removed.",
    statusCode: StatusCodes.OK,
    data: formElement,
    fieldName: "formElement",
  });
};

export const changeOrderFormElement = async ({ req }: ControllerParams) => {
  const formElement = await formElementService.changeOrderFormElement(req.params.id, req.body);

  return new ApiResponse({
    message: "FormElement order changed.",
    statusCode: StatusCodes.OK,
    data: formElement,
    fieldName: "formElement",
  });
};
