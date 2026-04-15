import { TaskInput } from "../../../models";

export type Query = Partial<TaskInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListTaskParams {
  query: Query;
  options?: {
    page?: number;
    limit?: number;
  };
}
