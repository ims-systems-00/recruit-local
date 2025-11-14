import express from "express";
import {
  listDocumentFolder,
  getDocumentFolder,
  createDocumentFolder,
  hardRemoveDocumentFolder,
  softRemoveDocumentFolder,
  restoreDocumentFolder,
  updateDocumentFolder,
} from "./document-folder.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema } from "./document-folder.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listDocumentFolder));
router.get("/:id", validateParams(idParamsSchema), handleController(getDocumentFolder));
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateBodySchema),
  handleController(updateDocumentFolder)
);
router.post("/", validateBody(createBodySchema), handleController(createDocumentFolder));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveDocumentFolder));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveDocumentFolder));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreDocumentFolder));

export default router;
