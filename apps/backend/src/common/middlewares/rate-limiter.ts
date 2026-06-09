import rateLimit from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { TooManyRequestsException } from "../helper";

// Global rate limit middleware
const globalRateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS),
  max: parseInt(process.env.RATE_LIMIT_MAX),
  message: "Too many GET requests from this IP, please try again later.",
  handler: (req: Request, res: Response, next: NextFunction) => {
    return next(new TooManyRequestsException());
  },
});

export { globalRateLimiter };
