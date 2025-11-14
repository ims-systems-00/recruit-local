import { InteractionInput } from "../../../models";

export type Query = Partial<InteractionInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListCommentActivityParams {
  query: Query;
  options?: IOptions;
}
