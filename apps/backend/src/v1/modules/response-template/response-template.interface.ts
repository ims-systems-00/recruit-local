import { ResponseTemplateInput } from "../../../models";

export type Query = Partial<ResponseTemplateInput & { _id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListCoCParams {
  query: Query;
  options?: IOptions;
}
