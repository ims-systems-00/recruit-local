import {
  IServiceListParams,
  IServiceGetParams,
  IServiceUpdateParams,
  IServiceCreateParams,
} from "../../../common/interface/service.interface";
import { UserInput as IUserInput, IUserDoc } from "../../../models/user.model";

// --- Standardized Parameter Interfaces ---
export type IListUserParams = IServiceListParams<IUserInput>;
export type IUserGetParams = IServiceGetParams<IUserInput>;
export type IUserUpdateParams = IServiceUpdateParams<IUserDoc>;
export type IUserCreateParams = IServiceCreateParams<IUserInput>;
