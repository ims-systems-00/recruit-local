import express from "express";
import {
  list,
  getOne,
  getCompletion,
  getAppliedJobs,
  create,
  update,
  evaluateValue,
  softRemove,
  hardRemove,
  restore,
} from "./job-profile.controller";
import { handleController } from "../../../common/helper";
import { validate, validateQuery, valueScoreRateLimiter } from "../../../common/middlewares";
import {
  updateBodySchema,
  idParamsSchema,
  createBodySchema,
  listQuerySchema,
  appliedJobsQuerySchema,
  valueScoreBodySchema,
} from "./job-profile.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

// job profile routes
router.get("/", validateQuery(listQuerySchema), handleController(list));
router.get("/:id", validateParams(idParamsSchema), handleController(getOne));
router.get("/:id/completion", validateParams(idParamsSchema), handleController(getCompletion));
router.get(
  "/:id/applied-jobs",
  validateParams(idParamsSchema),
  validateQuery(appliedJobsQuerySchema),
  handleController(getAppliedJobs)
);
router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
// Rate-limited first: every request that gets past validation is an LLM call.
router.post(
  "/:id/value-scores",
  valueScoreRateLimiter,
  validateParams(idParamsSchema),
  validateBody(valueScoreBodySchema),
  handleController(evaluateValue)
);
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
