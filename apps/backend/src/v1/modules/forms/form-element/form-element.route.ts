import express from "express";
import {
  listFormElement,
  getFormElement,
  createFormElement,
  hardRemoveFormElement,
  updateFormElement,
  changeOrderFormElement,
} from "./form-element.controller";
import { handleController } from "../../../../common/helper";
import { validate } from "../../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema, orderChangeBodySchema } from "./form-element.validation";

const router = express.Router({ mergeParams: true });

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listFormElement));
router.get("/:id", validateParams(idParamsSchema), handleController(getFormElement));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(updateFormElement));
router.post("/", validateBody(createBodySchema), handleController(createFormElement));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveFormElement));
router.put(
  "/:id/order",
  validateParams(idParamsSchema),
  validateBody(orderChangeBodySchema),
  handleController(changeOrderFormElement)
);

export default router;
