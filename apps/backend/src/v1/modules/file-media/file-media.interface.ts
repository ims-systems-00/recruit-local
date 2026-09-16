import { IOptions } from "@rl/types";
import { IFileMediaInput } from "../../../models";

export type Query = Partial<IFileMediaInput & { _id: string }>;

export interface IListFileMediaParams {
  query: Query;
  options?: IOptions;
}
