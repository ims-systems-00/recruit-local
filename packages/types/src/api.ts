import { FilterQuery } from 'mongoose';

export interface IOptions {
  page?: number;
  limit?: number;
}

export type ListQueryParams<T> = FilterQuery<T> & {
  _id?: string | string[];
};

export interface IListParams<T> {
  query: ListQueryParams<T>;
  options?: IOptions;
}
