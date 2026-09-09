interface OffsetPagination {
  totalDocs: number;
  limit: number;
  totalPages: number;
  page?: number;
  pagingCounter: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage?: number | null;
  nextPage?: number | null;
  /** Present on a migrated module's `?page=` response, so a caller can switch to cursors. */
  nextCursor?: string | null;
}

/** No totals: a cursor list never runs the `$count` branch. */
interface CursorPagination {
  limit: number;
  hasNextPage: boolean;
  nextCursor?: string | null;
}

interface ApiResponseConstructorParams {
  message: string;
  statusCode: number;
  cookies?: any;
  clearCookie?: any;
  data?: any;
  fieldName?: string;
  pagination?: OffsetPagination | CursorPagination;
}

export class ApiResponse {
  message: string;
  statusCode: number;
  cookies?: any;
  clearCookie?: any;
  pagination?: any;
  [key: string]: any;
  constructor({
    message,
    statusCode,
    cookies,
    clearCookie,
    data,
    fieldName,
    pagination,
  }: ApiResponseConstructorParams) {
    this.message = message;
    this.statusCode = statusCode;
    this.cookies = cookies;
    this.clearCookie = clearCookie;
    this[fieldName] = data;
    this.pagination = pagination;
  }
}
