import { JobProfileInput } from "../../../models";
import { VISIBILITY } from "@inrm/types";

export type Query = Partial<JobProfileInput & { id: string; visibility: VISIBILITY }>;

export interface IOptions {
  page?: number;
  limit?: number;
}

export interface IListJobProfileParams {
  query: Query;
  options?: IOptions;
}
