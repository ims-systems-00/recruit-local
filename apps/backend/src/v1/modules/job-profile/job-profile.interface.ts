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

// Transient upload templates accepted on writes: the service turns each into a
// FileMedia document, stores the resulting id in `profileImageId` / `coverPhotoId`,
// then strips these keys before persisting the job profile.
export interface IJobProfilePhotoStorage {
  profileImageStorage?: AwsStorageTemplate;
  coverPhotoStorage?: AwsStorageTemplate;
}

export interface IJobProfileUpdateParams {
  query: IJobProfileQueryParams;
  payload: Partial<JobProfileInput> & { kycDocumentStorage?: AwsStorageTemplate } & IJobProfilePhotoStorage;
  allowedFields?: string[];
}

export interface IJobProfileGetParams {
  query: IJobProfileQueryParams;
  allowedFields?: string[];
}

export interface IJobProfileCreateParams {
  payload: JobProfileInput & { kycDocumentStorage?: AwsStorageTemplate } & IJobProfilePhotoStorage;
  allowedFields?: string[];
}
