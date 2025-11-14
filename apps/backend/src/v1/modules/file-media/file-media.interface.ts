import { FileMediaInput } from "../../../models";

export type Query = Partial<FileMediaInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListFileMediaParams {
  query: Query;
  options?: IOptions;
}
