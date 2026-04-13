import { FilterQuery, ClientSession } from "mongoose";
import { IOptions } from "@rl/types";

// 1. Create a Mongoose-specific query type
export type IMongooseQueryParams<T> = FilterQuery<T> & {
  _id?: string | string[];
};

// 2. Create the robust backend Service interface
export interface IServiceListParams<T> {
  query: IMongooseQueryParams<T>;
  options?: IOptions;
  session?: ClientSession;
}

export interface IServiceGetParams<T> {
  query: IMongooseQueryParams<T>;
  session?: ClientSession;
}

export interface IServiceUpdateParams<T> {
  query: IMongooseQueryParams<T>;
  payload: Partial<T>;
  session?: ClientSession;
}

export interface IServiceCreateParams<T> {
  payload: T;
  session?: ClientSession;
}
