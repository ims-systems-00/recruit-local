import { IOptions } from "@rl/types";
import { FormElementInput } from "../../../../models";

export type Query = Partial<FormElementInput & { _id: string }> & Record<string, unknown>;

export interface IListFormElementParams {
  query: Query;
  options?: IOptions;
  offset?: number;
}
