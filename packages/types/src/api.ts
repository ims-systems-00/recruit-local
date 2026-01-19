export interface IOptions {
  page?: number;
  limit?: number;
}

export type ListQueryParams<T> = Partial<T & { _id: string }>;

// ? Question: export type ListQueryParams<T> = FilterQuery<T> update?

export interface IListParams<T> {
  query: ListQueryParams<T>;
  options?: IOptions;
}
