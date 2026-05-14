import { ClientSession } from "mongoose";
import { IOptions } from "@rl/types";
import { KeywordInput } from "../../../models/keyword.model";

export type KeywordQueryParams = Partial<KeywordInput> & {
  _id?: string | string[];
  [key: string]: any;
};

export interface IListKeywordParams {
  query?: KeywordQueryParams;
  options?: IOptions;
}

export interface IKeywordCreateParams {
  payload: Pick<KeywordInput, "text">;
  session?: ClientSession;
}

export interface IKeywordSearchParams {
  query: string;
  limit?: number;
}
