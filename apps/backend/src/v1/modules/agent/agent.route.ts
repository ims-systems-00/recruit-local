import express from "express";
import { handleController } from "../../../common/helper";
import { validate, validateQuery, agentRateLimiter, speechRateLimiter } from "../../../common/middlewares";
import {
  createConversationBodySchema,
  sendMessageBodySchema,
  idParamsSchema,
  traceStatsQuerySchema,
  conversationListQuerySchema,
  speechBodySchema,
  accessibilityBodySchema,
} from "./agent.validation";
import {
  createConversation,
  sendMessage,
  listConversations,
  getConversation,
  softRemoveConversation,
  getToolStats,
  getPreferences,
  updatePreferences,
} from "./agent.controller";
import { speak } from "./speech.controller";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

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

/**
 * Read-aloud. Rate limited on its own budget rather than the agent's — see
 * `speechRateLimiter` for why the two are not comparable.
 *
 * Responds with audio rather than JSON, which is why `speak` is a plain handler
 * instead of going through `handleController`.
 */
router.post("/speech", speechRateLimiter, validateBody(speechBodySchema), speak);

/**
 * How the assistant should communicate with this user. Not rate limited: both
 * are ordinary database operations on one small document, and the PATCH is what
 * a settings toggle calls.
 */
router.get("/preferences", handleController(getPreferences));
router.patch("/preferences", validateBody(accessibilityBodySchema), handleController(updatePreferences));

// Operational telemetry, not conversation content — platform admin only, gated
// in the controller.
router.get("/traces/stats", validateQuery(traceStatsQuerySchema), handleController(getToolStats));

router.get("/conversations", validateQuery(conversationListQuerySchema), handleController(listConversations));
router.get("/conversations/:id", validateParams(idParamsSchema), handleController(getConversation));
router.delete("/conversations/:id/soft", validateParams(idParamsSchema), handleController(softRemoveConversation));

export default router;
