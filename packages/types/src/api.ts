export interface IOptions {
  page?: number;
  limit?: number;
}

// Replaced FilterQuery with standard Partial<T> and an index signature for extra params
export type ListQueryParams<T> = Partial<T> & {
  _id?: string | string[];
  [key: string]: any;
};

export interface IListParams<T> {
  query: ListQueryParams<T>;
  options?: IOptions;
  allowedFields?: string[];
}
