export type Pagination = {
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

export type CursorPagination = {
  limit: number;
  hasNextPage: boolean;
  nextCursor: string;
};

export type PaginatedResponse<T> = {
  docs: T[];
  pagination: Pagination;
};

export type CursorPaginatedResponse<T> = {
  docs: T[];
  pagination: CursorPagination;
};

export type SuccessResponse<T> = {
  success: true;
  data: T;
  message?: string;
};

export type ErrorResponse = {
  success: false;
  message: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
