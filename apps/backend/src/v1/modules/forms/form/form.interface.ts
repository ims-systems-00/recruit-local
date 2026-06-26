import { FormInput } from "../../../../models";

export type Query = Partial<FormInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListFormParams {
  query: Query;
  options?: {
    page?: number;
    limit?: number;
  };
}
