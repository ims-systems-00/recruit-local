import { EducationInput } from "../../../models";

export type Query = Partial<EducationInput & { id: string }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListEducationProfileParams {
  query: Query;
  options?: IOptions;
}
