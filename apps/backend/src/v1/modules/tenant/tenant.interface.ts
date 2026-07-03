import { ClientSession } from "mongoose";
import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";
import { TenantInput, ITenantDoc } from "../../../models";
import { AwsStorageTemplate } from "../../../models/templates/aws-storage.template";

// Transient upload templates accepted on writes: the service turns each into a
// FileMedia document and stores the resulting ObjectId in `profileImageId` /
// `coverPhotoId`, then strips these keys before persisting the tenant.
export interface ITenantPhotoStorage {
  profileImageStorage?: AwsStorageTemplate;
  coverPhotoStorage?: AwsStorageTemplate;
}

// --- Standardized Parameter Interfaces ---
export type IListTenantParams = IServiceListParams<TenantInput>;
export type ITenantGetParams = IServiceGetParams<TenantInput>;
export interface ITenantUpdateParams extends Omit<IServiceUpdateParams<ITenantDoc>, "payload"> {
  payload: Partial<ITenantDoc> & ITenantPhotoStorage;
}
export interface ITenantCreateParams extends Omit<IServiceCreateParams<TenantInput>, "payload"> {
  payload: TenantInput & ITenantPhotoStorage;
}
export interface ITenantUpdateLogoParams {
  tenantId: string;
  logoType: "square" | "rectangle";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any;
  session?: ClientSession;
}
