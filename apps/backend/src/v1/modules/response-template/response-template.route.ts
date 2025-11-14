import express from "express";
import {
  listResponseTemplate,
  getResponseTemplate,
  createResponseTemplate,
  hardRemoveResponseTemplate,
  softRemoveResponseTemplate,
  restoreResponseTemplate,
  updateResponseTemplate,
} from "./response-template.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./response-template.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listResponseTemplate));
router.get("/:id", validateParams(idParamsSchema), handleController(getResponseTemplate));
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateBodySchema),
  handleController(updateResponseTemplate)
);
router.post("/", validateBody(createBodySchema), handleController(createResponseTemplate));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveResponseTemplate));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveResponseTemplate));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreResponseTemplate));

export default router;
