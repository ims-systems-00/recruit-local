import { StatusCodes } from "http-status-codes";
import { MongoQuery } from "@ims-systems-00/ims-query-builder";
import * as formElementService from "./form-element.service";
import { ApiResponse, ControllerParams } from "../../../../common/helper";

export const listFormElement = async ({ req }: ControllerParams) => {
  const filter = new MongoQuery(
    { ...req.query, formId: req.params.formId },
    {
      searchFields: ["name"],
      strictObjectIdMatch: true,
    }
  ).build();

  const query = { ...filter.getFilterQuery() };
  const options = filter.getQueryOptions();

  const results = await formElementService.listFormElement({ query, options });
  const { docs: data, ...pagination } = results;

  return new ApiResponse({
    message: "FormElements retrieved.",
    statusCode: StatusCodes.OK,
    data,
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
