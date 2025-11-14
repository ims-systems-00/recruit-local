import express from "express";
import {
  listTask,
  getTask,
  createTask,
  hardRemoveTask,
  softRemoveTask,
  restoreTask,
  updateTask,
  createTaskSubResource,
  removeTaskSubResource,
} from "./task.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import {
  createBodySchema,
  updateBodySchema,
  idParamsSchema,
  subResourceCreateParamsSchema,
  subResourceBodySchema,
  subResourceRemoveParamsSchema,
} from "./task.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listTask));
router.get("/:id", validateParams(idParamsSchema), handleController(getTask));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(updateTask));
router.post("/", validateBody(createBodySchema), handleController(createTask));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveTask));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveTask));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreTask));
router.post(
  "/:id/:subResource",
  validateParams(subResourceCreateParamsSchema),
  validateBody(subResourceBodySchema),
  handleController(createTaskSubResource)
);
router.delete(
  "/:id/:subResource/:subResourceId",
  validateParams(subResourceRemoveParamsSchema),
  handleController(removeTaskSubResource)
);

export default router;
