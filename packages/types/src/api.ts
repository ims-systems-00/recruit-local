export interface IOptions {
  page?: number;
  limit?: number;
}

export type ListQueryParams<T> = Partial<T & { _id: string }>;

export interface IListParams<T> {
  query: ListQueryParams<T>;
  options?: IOptions;
}
