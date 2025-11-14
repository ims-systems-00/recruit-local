import express from "express";
import {
  listFormSubmission,
  getFormSubmission,
  createFormSubmission,
  hardRemoveFormSubmission,
  updateFormSubmission,
} from "./form-submission.controller";
import { handleController } from "../../../../common/helper";
import { validate } from "../../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./form-submission.validation";

const router = express.Router({ mergeParams: true });

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listFormSubmission));
router.get("/:id", validateParams(idParamsSchema), handleController(getFormSubmission));
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateBodySchema),
  handleController(updateFormSubmission)
);
router.post("/", validateBody(createBodySchema), handleController(createFormSubmission));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveFormSubmission));

export default router;
