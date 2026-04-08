import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";
import { LocationInput, ILocationDoc } from "../../../models/location.model";

// --- Standardized Parameter Interfaces ---
export type IListLocationParams = IServiceListParams<LocationInput>;
export type ILocationGetParams = IServiceGetParams<LocationInput>;
export type ILocationUpdateParams = IServiceUpdateParams<ILocationDoc>;
export type ILocationCreateParams = IServiceCreateParams<LocationInput>;
