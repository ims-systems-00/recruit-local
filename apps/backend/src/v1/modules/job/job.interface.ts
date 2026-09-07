import { ClientSession } from "mongoose";
import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";
import { IJobInput, IJobDoc } from "../../../models/job.model";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";
import { JobSearchPreFilter } from "./job.query";

// --- Standardized Parameter Interfaces ---

export interface IJobCreateParams extends IServiceCreateParams<IJobInput> {
  payload: IJobInput & {
    autoFill?: boolean;
    bannerStorage?: AwsStorageTemplate;
    attachmentsStorage?: AwsStorageTemplate[];
  };
  session?: ClientSession;
}
export interface IJobListParams extends IServiceListParams<IJobDoc> {
  tenantId?: string;
  jobProfileId?: string;
  // When set, jobs get a `matchScore` = keyword overlap with these, for ranking.
  matchKeywords?: string[];
  // When set, the pipeline opens with a hybrid Atlas search stage instead of $match.
  searchTerm?: string;
  searchVector?: number[];
  searchPreFilter?: JobSearchPreFilter;
}
export interface IJobGetParams extends IServiceGetParams<IJobDoc> {
  tenantId?: string;
  jobProfileId?: string;
}
export interface IJobUpdateParams extends IServiceUpdateParams<IJobDoc> {
  payload: Partial<IJobDoc> & {
    autoFill?: boolean;
    bannerStorage?: AwsStorageTemplate;
    attachmentsStorage?: AwsStorageTemplate[];
  };
}

export interface IJobIncrementStatsParams {
  query: Partial<IJobInput & { _id: string }>;
  payload: {
    totalApplications?: number;
  };
  session?: ClientSession;
}
