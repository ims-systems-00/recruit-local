import express from "express";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createReactionBodySchema, updateReactionBodySchema, reactionIdParamsSchema } from "./reaction.validation";
import { list, getOne, create, update, softRemove, hardRemove, restore } from "./reaction.controller";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

// reaction routes
router.get("/", handleController(list));
router.get("/:id", validateParams(reactionIdParamsSchema), handleController(getOne));
router.post("/", validateBody(createReactionBodySchema), handleController(create));
router.put(
  "/:id",
  validateParams(reactionIdParamsSchema),
  validateBody(updateReactionBodySchema),
  handleController(update)
);
router.delete("/:id/soft", validateParams(reactionIdParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(reactionIdParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(reactionIdParamsSchema), handleController(restore));

export default router;
