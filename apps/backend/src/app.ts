import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import {
  globalRateLimiter,
  customQueryParser,
  bullBoardRateLimiter,
  deserializeUser,
  platformAdminOnly,
} from "./common/middlewares";
import { globalErrorHandler, NotFoundException } from "./common/helper";
import { CORS_ORIGIN } from "./common/constants";
import { setupApiRoutes } from "./v1/routes/api-routes";
import { setupAgenda } from "./agenda";
import { initBullBoard } from "./.config/bull-board";

export const app = express();

const corsOptions = {
  origin: CORS_ORIGIN[process.env.NODE_ENV] || CORS_ORIGIN.development,
  credentials: true,
};

// Enable CORS request
app.use(cors(corsOptions));

// Set security HTTP headers
app.use(helmet());

// Development Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Limit request with same API
app.use("/api", globalRateLimiter);

// Body parser, reading data from body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve cookie in request object
app.use(cookieParser());

// Data sanitization against NO-SQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS

// Prevent parameter pollution
app.use(hpp());

// Custom query parser
app.use(customQueryParser);

// The board reads and mutates every queue, so it is gated on a platform-admin
// session. It is mounted outside `setupApiRoutes`, which means the app-wide
// `deserializeUser` never reaches it — the chain below is the only thing
// standing in front of it, and the order matters: limit, identify, authorize.
const bullBoard = initBullBoard();
if (bullBoard) {
  app.use(bullBoard.path, bullBoardRateLimiter, deserializeUser, platformAdminOnly, bullBoard.router);
}

app.get("/", (req, res) => {
  res.status(200).json({ message: "Active" });
});

// Load API routes
setupApiRoutes(app);
setupAgenda(app);

// Global error handler
app.all("*", (req, res, next) => {
  next(new NotFoundException(`Can't find ${req.method} ${req.originalUrl} on this server.`));
});

app.use(globalErrorHandler);
