import { IActionInput } from "../../../models";

export type Query = Partial<IActionInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListCommentActivityParams {
  query: Query;
  options?: IOptions;
}
