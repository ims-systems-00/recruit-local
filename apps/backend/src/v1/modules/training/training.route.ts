import express from "express";

import { list, get, create, update, softRemove, hardRemove, restore } from "./training.controller";
import { handleController } from "../../../common/helper";
import { parseBody, validate, validateQuery } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema, listQuerySchema } from "./training.validation";

const router = express.Router();
const validateParams = validate("params");

// training routes
// Bodies use `parseBody`: the schemas trim text and drop an enrolled training's end date.
router.get("/", validateQuery(listQuerySchema), handleController(list));
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.post("/", parseBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), parseBody(updateBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
