import { IUserDoc, UserInput } from "../../../models";
import { IListParams, ListQueryParams } from "@rl/types";

// --- Standardized Parameter Interfaces ---
export type IListUserParams = IListParams<UserInput>;
export type IUserQueryParams = ListQueryParams<UserInput>;

export interface IUserUpdateParams {
  query: IUserQueryParams;
  payload: Partial<IUserDoc>;
  allowedFields?: string[];
}

export interface IUserGetParams {
  query: IUserQueryParams;
  allowedFields?: string[];
}

export interface IUserCreateParams {
  payload: UserInput;
  allowedFields?: string[];
}
