import { IOptions } from "@rl/types";
import { IActionInput } from "../../../models";

export type Query = Partial<IActionInput & { _id: string }>;

export interface IListCommentActivityParams {
  query: Query;
  options?: IOptions;
  offset?: number;
}
