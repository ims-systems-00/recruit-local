import express from "express";
import { list, getOne, create, update, softRemove, hardRemove, restore } from "./job-profile.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { updateBodySchema, idParamsSchema, createBodySchema } from "./job-profile.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

// job profile routes
router.get("/", handleController(list));
router.get("/:id", validateParams(idParamsSchema), handleController(getOne));
router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
