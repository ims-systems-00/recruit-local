import express from "express";
import { create, update, softRemove, hardRemove, restore } from "./salary.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./salary.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
