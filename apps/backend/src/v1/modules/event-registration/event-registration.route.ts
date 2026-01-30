import express from "express";
import { validate } from "../../../common/middlewares";
import { list, getOne, create, update, softRemove, hardRemove, restore } from "./event-registration.controller";
import { handleController } from "../../../common/helper";
import {
  createEventRegistrationBodySchema,
  updateEventRegistrationBodySchema,
  eventRegistrationListQuerySchema,
} from "./event-registration.validation";

import { idParamsSchema } from "../user/user.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");
const validateQuery = validate("query");

router.post("/", validateBody(createEventRegistrationBodySchema), handleController(create));
router.get("/", validateQuery(eventRegistrationListQuerySchema), handleController(list));

router.get("/:id", validateParams(idParamsSchema), handleController(getOne));
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateEventRegistrationBodySchema),
  handleController(update)
);

router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
