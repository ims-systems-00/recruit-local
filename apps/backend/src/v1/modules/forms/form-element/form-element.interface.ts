import { FormElementInput } from "../../../../models";

export type Query = Partial<FormElementInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListFormElementParams {
  query: Query;
  options?: {
    page?: number;
    limit?: number;
  };
}
