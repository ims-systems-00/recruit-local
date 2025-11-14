import express from "express";
import {
  listFileMedia,
  getFileMedia,
  createFileMedia,
  hardRemoveFileMedia,
  softRemoveFileMedia,
  restoreFileMedia,
  updateFileMedia,
} from "./file-media.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./file-media.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listFileMedia));
router.get("/:id", validateParams(idParamsSchema), handleController(getFileMedia));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(updateFileMedia));
router.post("/", validateBody(createBodySchema), handleController(createFileMedia));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveFileMedia));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveFileMedia));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreFileMedia));

export default router;
