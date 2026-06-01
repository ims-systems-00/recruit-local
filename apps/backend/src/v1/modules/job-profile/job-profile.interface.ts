import { JobProfileInput } from "../../../models";
import { IListParams, ListQueryParams } from "@rl/types";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// export type Query = Partial<JobProfileInput & { id: string; visibility: VISIBILITY }>;

// export interface IOptions {
//   page?: number;
//   limit?: number;
// }

// export interface IListJobProfileParams {
//   query: Query;
//   options?: IOptions;
// }

// --- Standardized Parameter Interfaces ---
export type IListJobProfileParams = IListParams<JobProfileInput>;
export type IJobProfileQueryParams = ListQueryParams<JobProfileInput>;

export interface IJobProfileUpdateParams {
  query: IJobProfileQueryParams;
  payload: Partial<JobProfileInput> & { kycDocumentStorage?: AwsStorageTemplate };
  allowedFields?: string[];
}

export interface IJobProfileGetParams {
  query: IJobProfileQueryParams;
  allowedFields?: string[];
}

export interface IJobProfileCreateParams {
  payload: JobProfileInput & { kycDocumentStorage?: AwsStorageTemplate };
  allowedFields?: string[];
}
