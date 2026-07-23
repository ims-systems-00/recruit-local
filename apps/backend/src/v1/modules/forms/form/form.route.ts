import express from "express";
import {
  listForm,
  getForm,
  createForm,
  hardRemoveForm,
  softRemoveForm,
  restoreForm,
  updateForm,
} from "./form.controller";
import { handleController } from "../../../../common/helper";
import { validate } from "../../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./form.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listForm));
router.get("/:id", validateParams(idParamsSchema), handleController(getForm));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(updateForm));
router.post("/", validateBody(createBodySchema), handleController(createForm));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveForm));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveForm));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreForm));

export default router;
