export interface IOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1 | 'asc' | 'desc'> | string;
}

export type ListQueryParams<T> = Partial<T> & {
  _id?: string | string[];
  [key: string]: any;
};

export interface IListParams<T> {
  query: ListQueryParams<T>;
  options?: IOptions;
  allowedFields?: string[];
}
