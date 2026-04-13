import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";

// Assuming these are your imports based on context
import { ApplicationInput, IApplicationDoc } from "../../../models/application.model";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// --- Standardized Parameter Interfaces ---

export type IListApplicationParams = IServiceListParams<ApplicationInput>;
export type IApplicationGetParams = IServiceGetParams<ApplicationInput>;
export type IApplicationCreateParams = IServiceCreateParams<ApplicationInput & { resumeStorage?: AwsStorageTemplate }>;
export type IApplicationUpdateParams = IServiceUpdateParams<IApplicationDoc & { resumeStorage?: AwsStorageTemplate }>;
export type IApplicationQueryParams = Partial<ApplicationInput & { _id: string }>;

export interface IApplicationStatusUpdateParams {
  query: IApplicationQueryParams;
  status: string;
}

export interface IMoveBoardItemParams {
  itemId: string;
  targetStatusId: string;
  targetIndex: number;
}
