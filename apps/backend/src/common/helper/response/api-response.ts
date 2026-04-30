interface ApiResponseConstructorParams {
  message: string;
  statusCode: number;
  cookies?: any;
  clearCookie?: any;
  data?: any;
  fieldName?: string;
  pagination?: {
    totalDocs: number;
    limit: number;
    totalPages: number;
    page?: number;
    pagingCounter: number;
    hasPrevPage: boolean;
    hasNextPage: boolean;
    prevPage?: number | null;
    nextPage?: number | null;
  };
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
