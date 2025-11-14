import express from "express";
import {
  listNotification,
  getNotification,
  createNotification,
  hardRemoveNotification,
  softRemoveNotification,
  restoreNotification,
  updateNotification,
} from "./notification.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./notification.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listNotification));
router.get("/:id", validateParams(idParamsSchema), handleController(getNotification));
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateBodySchema),
  handleController(updateNotification)
);
router.post("/", validateBody(createBodySchema), handleController(createNotification));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveNotification));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveNotification));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreNotification));

export default router;
