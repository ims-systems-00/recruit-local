import { TenantInput } from "../../../models";

export type Query = Partial<TenantInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListTenantParams {
  query: Query;
  options?: {
    page?: number;
    limit?: number;
  };
}

export interface IListUsersParams {
  query: any;
  options?: {
    page?: number;
    limit?: number;
  };
}
