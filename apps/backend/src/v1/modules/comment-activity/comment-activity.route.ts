import express from "express";
import {
  listCommentActivity,
  getCommentActivity,
  createCommentActivity,
  hardRemoveCommentActivity,
  softRemoveCommentActivity,
  restoreCommentActivity,
  updateCommentActivity,
} from "./comment-activity.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./comment-activity.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listCommentActivity));
router.get("/:id", validateParams(idParamsSchema), handleController(getCommentActivity));
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateBodySchema),
  handleController(updateCommentActivity)
);
router.post("/", validateBody(createBodySchema), handleController(createCommentActivity));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveCommentActivity));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveCommentActivity));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreCommentActivity));

export default router;
