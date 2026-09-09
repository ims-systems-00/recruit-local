import { StatusCodes } from "http-status-codes";
import * as formSubmissionService from "./form-submission.service";
import { ApiResponse, ControllerParams } from "../../../../common/helper";
import { runCursorList } from "../../../../common/query";
import { formSubmissionListQuerySpec } from "./form-submission.query";
import { ICreateFormSubmission } from "./form-submission.interface";

export const listFormSubmission = async ({ req }: ControllerParams) => {
  const { docs, pagination } = await runCursorList({
    query: req.query,
    spec: formSubmissionListQuerySpec,
    // The route param is the scope, not a caller-supplied filter.
    extraConditions: [{ formId: req.params.formId }],
    fetch: ({ query, options, offset }) => formSubmissionService.listFormSubmission({ query, options, offset }),
    count: ({ query }) => formSubmissionService.countFormSubmission({ query }),
  });

  return new ApiResponse({
    message: "FormSubmissions retrieved.",
    statusCode: StatusCodes.OK,
    data: docs,
    fieldName: "formSubmissions",
    pagination,
  });
};

export const getFormSubmission = async ({ req }: ControllerParams) => {
  const params = { submissionId: req.params.id, formId: req.params.formId, tenantId: req.params.tenantId || null };
  const formSubmission = await formSubmissionService.getFormSubmission(params);

  return new ApiResponse({
    message: "FormSubmission retrieved.",
    statusCode: StatusCodes.OK,
    data: formSubmission,
    fieldName: "formSubmission",
  });
};

export const updateFormSubmission = async ({ req }: ControllerParams) => {
  const formSubmission = await formSubmissionService.updateFormSubmission(req.params.id, req.body);

  return new ApiResponse({
    message: "FormSubmission updated.",
    statusCode: StatusCodes.OK,
    data: formSubmission,
    fieldName: "formSubmission",
  });
};

export const createFormSubmission = async ({ req }: ControllerParams) => {
  const payload: ICreateFormSubmission = {
    ...req.body,
    formId: req.params.formId,
    submittedBy: null,
    tenantId: null,
  };
  const formSubmission = await formSubmissionService.createFormSubmission(payload);

  return new ApiResponse({
    message: "FormSubmission created.",
    statusCode: StatusCodes.CREATED,
    data: formSubmission,
    fieldName: "formSubmission",
  });
};

export const hardRemoveFormSubmission = async ({ req }: ControllerParams) => {
  const tenantId = req.params.tenantId || null;
  const formSubmission = await formSubmissionService.hardRemoveFormSubmission(req.params.id);

  return new ApiResponse({
    message: "FormSubmission removed.",
    statusCode: StatusCodes.OK,
    data: formSubmission,
    fieldName: "formSubmission",
  });
};
