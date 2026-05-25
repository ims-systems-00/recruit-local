import express from "express";
import { list, get, create, update, softRemove, hardRemove, restore } from "./job-title.controller";
import { handleController } from "../../../common/helper";
import { deserializeUser, validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./job-title.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(list));
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.use(deserializeUser);
router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
