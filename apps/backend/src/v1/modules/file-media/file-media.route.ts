import express from "express";
import { list, get, create, hardRemove, softRemove, restore, update } from "./file-media.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./file-media.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(list));
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.post("/", validateBody(createBodySchema), handleController(create));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
