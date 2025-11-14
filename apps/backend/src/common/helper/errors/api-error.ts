import { StatusCodes, ReasonPhrases } from "http-status-codes";

interface ApiErrorOptions {
  details?: string;
  appCode?: number | null;
  httpReasonPhrase?: ReasonPhrases;
  httpStatusCode?: StatusCodes;
}

export class ApiError extends Error {
  public details?: string;
  public appCode?: number | null;
  public httpReasonPhrase?: string;
  public httpStatusCode?: number;
  public timestamp: Date;
  public isOperational: boolean;

  constructor(
    message = "",
    options: ApiErrorOptions = {
      details: "",
      appCode: null,
      httpReasonPhrase: ReasonPhrases.INTERNAL_SERVER_ERROR,
      httpStatusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    }
  ) {
    super(message);
    this.details = options?.details;
    this.httpStatusCode = options?.httpStatusCode;
    this.httpReasonPhrase = options?.httpReasonPhrase;
    this.appCode = options?.appCode;
    this.timestamp = new Date();
    this.isOperational = true;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this);
  }

  get name() {
    return "ApiError";
  }
}

export class AuditCompletedError extends ApiError {
  constructor() {
    super("Audit is already completed.", {
      details: "A completed audit cannot be deleted or modified. Please change the audit status to modify or delete.",
      httpReasonPhrase: ReasonPhrases.BAD_REQUEST,
      httpStatusCode: StatusCodes.BAD_REQUEST,
      appCode: 1,
    });
  }
}

export class NotFoundException extends ApiError {
  constructor(message = "Not Found.") {
    super(message, {
      httpStatusCode: StatusCodes.NOT_FOUND,
      httpReasonPhrase: ReasonPhrases.NOT_FOUND,
    });
  }
}

export class BadRequestException extends ApiError {
  constructor(message = "Bad Request.") {
    super(message, {
      httpStatusCode: StatusCodes.BAD_REQUEST,
      httpReasonPhrase: ReasonPhrases.BAD_REQUEST,
    });
  }
}

export class UnauthorizedException extends ApiError {
  constructor(message = "Unauthorized.") {
    super(message, {
      httpStatusCode: StatusCodes.UNAUTHORIZED,
      httpReasonPhrase: ReasonPhrases.UNAUTHORIZED,
    });
  }
}

export class TooManyRequestsException extends ApiError {
  constructor(message = "Too many requests.") {
    super(message, {
      httpStatusCode: StatusCodes.TOO_MANY_REQUESTS,
      httpReasonPhrase: ReasonPhrases.TOO_MANY_REQUESTS,
    });
  }
}
export class EmailMissConfigException extends ApiError {
  constructor(message = "Invalid email contents, email can not be sent.") {
    super(message, {
      httpStatusCode: StatusCodes.BAD_REQUEST,
      httpReasonPhrase: ReasonPhrases.BAD_REQUEST,
    });
  }
}

export class SessionExpiredException extends ApiError {
  constructor(message = "Session expired.") {
    super(message, {
      httpStatusCode: StatusCodes.FORBIDDEN,
      httpReasonPhrase: ReasonPhrases.FORBIDDEN,
    });
  }
}

export class NonconformityAlreadyResolvedException extends BadRequestException {
  constructor() {
    super("Nonconformity is already resolved.");
  }
}

export class OFIAlreadyResolvedException extends BadRequestException {
  constructor() {
    super("OFI is already resolved.");
  }
}

export class AlreadyHaveMembershipException extends BadRequestException {
  constructor() {
    super("Already a member of the team.");
  }
}

export class AuditUpdateError extends ApiError {
  constructor(message = "Can not update the audit.") {
    super(message, {
      details:
        "Audit details are only allowed to update when the audit is the following status: scheduled, in-progress.",
      httpReasonPhrase: ReasonPhrases.BAD_REQUEST,
      httpStatusCode: StatusCodes.BAD_REQUEST,
      appCode: 1,
    });
  }
}

export class CocMediaAlreadyApprovedException extends BadRequestException {
  constructor() {
    super("Coc Media is already approved.");
  }
}

export class CocRequestCompletedException extends BadRequestException {
  constructor() {
    super("Coc Request is already completed.");
  }
}
