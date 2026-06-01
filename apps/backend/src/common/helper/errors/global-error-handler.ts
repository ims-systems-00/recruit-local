import { Request, Response, NextFunction } from "express";
import { MongooseError } from "mongoose";
import { logger } from "../logger";
import { BadRequestException } from "./api-error";

interface ErrorWithStatus extends Error {
  httpStatusCode?: number;
  status?: string;
  isOperational?: boolean;
  code?: number;
}

const handleDatabaseError = (error: MongooseError) => {
  if (error instanceof MongooseError) {
    return new BadRequestException(error.message);
  }
};

const sendErrorDev = (err: ErrorWithStatus, req: Request, res: Response): void => {
  logger.error(err.message);

  res.status(err.httpStatusCode || 500).json({
    status: err.status || "error",
    message: err.message,
    error: err,
    stack: err.stack,
  });
};

const sendErrorProd = (err: ErrorWithStatus, req: Request, res: Response): void => {
  if (err.isOperational) {
    res.status(err.httpStatusCode || 500).json({
      status: err.status || "error",
      message: err.message,
    });
  } else {
    // Log unknown errors
    logger.error(err);

    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

const globalErrorHandler = (err: ErrorWithStatus, req: Request, res: Response, next: NextFunction): void => {
  err.httpStatusCode = err.httpStatusCode || 500;
  err.status = err.status || "error";

  if (err instanceof MongooseError) {
    err = handleDatabaseError(err);
  }

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, req, res);
  } else {
    let error = { ...err, message: err.message, name: err.name };
    sendErrorProd(error, req, res);
  }
};

export { globalErrorHandler };
