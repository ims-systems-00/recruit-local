import { ClientSession } from "mongoose";
import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";
import { TenantInput, ITenantDoc } from "../../../models";

// --- Standardized Parameter Interfaces ---
export type IListTenantParams = IServiceListParams<TenantInput>;
export type ITenantGetParams = IServiceGetParams<TenantInput>;
export type ITenantUpdateParams = IServiceUpdateParams<ITenantDoc>;
export type ITenantCreateParams = IServiceCreateParams<TenantInput>;
export interface ITenantUpdateLogoParams {
  tenantId: string;
  logoType: "square" | "rectangle";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  file: any;
  session?: ClientSession;
}
