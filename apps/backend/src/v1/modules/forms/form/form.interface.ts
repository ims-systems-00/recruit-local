import { IOptions } from "@rl/types";
import { FormInput } from "../../../../models";

export type Query = Partial<FormInput & { _id: string }> & Record<string, unknown>;

export interface IListFormParams {
  query: Query;
  options?: IOptions;
  offset?: number;
}
