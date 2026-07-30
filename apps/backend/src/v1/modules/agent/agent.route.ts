import express from "express";
import { handleController } from "../../../common/helper";
import { validate, agentRateLimiter } from "../../../common/middlewares";
import {
  createConversationBodySchema,
  sendMessageBodySchema,
  idParamsSchema,
  traceStatsQuerySchema,
} from "./agent.validation";
import {
  createConversation,
  sendMessage,
  listConversations,
  getConversation,
  softRemoveConversation,
  getToolStats,
} from "./agent.controller";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");
const validateQuery = validate("query");

// Runs cost tokens, so the two endpoints that invoke the model are rate limited
// per user; the read endpoints are not.
router.post(
  "/conversations",
  agentRateLimiter,
  validateBody(createConversationBodySchema),
  handleController(createConversation)
);
router.post(
  "/conversations/:id/messages",
  agentRateLimiter,
  validateParams(idParamsSchema),
  validateBody(sendMessageBodySchema),
  handleController(sendMessage)
);

// Operational telemetry, not conversation content — platform admin only, gated
// in the controller.
router.get("/traces/stats", validateQuery(traceStatsQuerySchema), handleController(getToolStats));

router.get("/conversations", handleController(listConversations));
router.get("/conversations/:id", validateParams(idParamsSchema), handleController(getConversation));
router.delete("/conversations/:id/soft", validateParams(idParamsSchema), handleController(softRemoveConversation));

export default router;
