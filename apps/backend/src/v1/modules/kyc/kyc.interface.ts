import { ClientSession } from "mongoose";
import { IListParams, ListQueryParams } from "@rl/types";
import { IKycDoc, IKycInput } from "../../../models";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

export type IKycListParams = IListParams<IKycDoc>;
export type IKycQueryParams = ListQueryParams<IKycInput>;

export interface IKycListQueryParams extends IKycListParams {
  session?: ClientSession;
}

export interface IKycGetParams {
  query: IKycQueryParams;
  session?: ClientSession;
}

export interface IKycCreateParams {
  payload: Omit<IKycInput, "documentFrontId" | "documentBackId"> & {
    documentFrontStorage?: AwsStorageTemplate;
    documentBackStorage?: AwsStorageTemplate;
  };
  session?: ClientSession;
}

export interface IKycUpdateParams {
  query: IKycQueryParams;
  payload: Partial<Omit<IKycInput, "documentFrontId" | "documentBackId">> & {
    documentFrontStorage?: AwsStorageTemplate;
    documentBackStorage?: AwsStorageTemplate | null;
    status?: IKycDoc["status"];
    rejectionReason?: string;
  };
  session?: ClientSession;
}
