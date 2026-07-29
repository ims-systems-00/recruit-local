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

/**
 * Per-user limiter for agent runs.
 *
 * Keyed on the user rather than the IP: every run costs real LLM tokens, and it
 * bills to the same OpenAI account the CV extractor depends on, so one abusive
 * user degrades CV parsing too. Deliberately tight to start with — raise it
 * once there is usage data. Falls back to the IP for unauthenticated callers,
 * which should not reach these routes anyway.
 */
const agentRateLimiter = rateLimit({
  windowMs: parseInt(process.env.AGENT_RATE_LIMIT_WINDOW_MS || "60000"),
  max: parseInt(process.env.AGENT_RATE_LIMIT_MAX || "10"),
  keyGenerator: (req: Request) => req.session?.user?._id || req.ip,
  handler: (req: Request, res: Response, next: NextFunction) => {
    return next(new TooManyRequestsException("Too many agent requests. Please wait a moment and try again."));
  },
});

export { globalRateLimiter, agentRateLimiter };
