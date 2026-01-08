import express from "express";
import { list, get, create, update, softRemove, hardRemove, restore } from "./event.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createEventBodySchema, updateEventBodySchema, eventListQuerySchema } from "./event.validation";

import { idParamsSchema } from "../user/user.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");
const validateQuery = validate("query");

router.post("/", validateBody(createEventBodySchema), handleController(create));
router.get("/", validateQuery(eventListQuerySchema), handleController(list));

router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateEventBodySchema), handleController(update));

router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
