import { UserInput } from "../../../models";

export type Query = Partial<UserInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListUserParams {
  query: Query;
  options?: IOptions;
}
