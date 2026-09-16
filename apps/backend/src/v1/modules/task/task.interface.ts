import { IOptions } from "@rl/types";
import { TaskInput } from "../../../models";

export type Query = Partial<TaskInput & { _id: string }>;

export interface IListTaskParams {
  query: Query;
  options?: IOptions;
  offset?: number;
}
