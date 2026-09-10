import express from "express";
import { list, get, create, update, softRemove, hardRemove, restore } from "./work-mode.controller";
import { handleController } from "../../../common/helper";
import { validate, validateQuery } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema, listQuerySchema } from "./work-mode.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", validateQuery(listQuerySchema), handleController(list));
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
