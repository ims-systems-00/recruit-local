import {
  IServiceCreateParams,
  IServiceGetParams,
  IServiceListParams,
  IServiceUpdateParams,
} from "../../../common/interface/service.interface";
import { IFavouriteInput } from "../../../models";

export type IListFavouriteParams = IServiceListParams<IFavouriteInput>;
export type IFavouriteGetParams = IServiceGetParams<IFavouriteInput>;
export type IFavouriteCreateParams = IServiceCreateParams<IFavouriteInput>;
export type IFavouriteUpdateParams = IServiceUpdateParams<IFavouriteInput>;
