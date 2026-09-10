import { IOptions } from "@rl/types";
import { Schema } from "mongoose";
import { FormSubmissionInput } from "../../../../models";

export type Query = Partial<FormSubmissionInput & { _id: string }> & Record<string, unknown>;

export interface IListFormSubmissionParams {
  query: Query;
  options?: IOptions;
  offset?: number;
}

export interface ICreateFormSubmission extends FormSubmissionInput {
  responses: {
    formElementId: string;
    responseValue: Record<string, unknown>;
  }[];
}

export interface IUpdateFormSubmission {
  responses: {
    formElementId: string;
    responseValue: Record<string, unknown>;
  }[];
}

export interface IGetFormSubmission {
  submissionId: string | Schema.Types.ObjectId;
  formId: string | Schema.Types.ObjectId;
  tenantId: Schema.Types.ObjectId | null;
}
