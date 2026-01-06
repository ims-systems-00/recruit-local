import express from "express";

import { list, get, create, update, softRemove, hardRemove, restore, statusUpdate } from "./application.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema, statusUpdateBodySchema } from "./application.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

// application routes
router.get("/", handleController(list));
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.put(
  "/:id/status",
  validateParams(idParamsSchema),
  validateBody(statusUpdateBodySchema),
  handleController(statusUpdate)
);
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
