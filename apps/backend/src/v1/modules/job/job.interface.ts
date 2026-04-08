import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";
import { IJobInput, IJobDoc } from "../../../models/job.model";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// --- Standardized Parameter Interfaces ---

export interface IJobCreateParams extends IServiceCreateParams<IJobInput> {
  payload: IJobInput & {
    autoFill?: boolean;
    bannerStorage?: AwsStorageTemplate;
    attachmentsStorage?: AwsStorageTemplate[];
  };
}
export type IJobListParams = IServiceListParams<IJobDoc>;
export type IJobGetParams = IServiceGetParams<IJobDoc>;
export interface IJobUpdateParams extends IServiceUpdateParams<IJobDoc> {
  payload: Partial<IJobInput> & {
    autoFill?: boolean;
    bannerStorage?: AwsStorageTemplate;
    attachmentsStorage?: AwsStorageTemplate[];
  };
}
