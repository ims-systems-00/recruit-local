export type CursorPagination = {
  limit: number;
  hasNextPage: boolean;
  /** null on the last page. */
  nextCursor: string | null;
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
