import express from "express";

import {
  list,
  get,
  resumeUrl,
  create,
  update,
  softRemove,
  hardRemove,
  restore,
  extractAndCreate,
  extract,
  importToProfile,
  importRecords,
} from "./cv.controller";
import { handleController } from "../../../common/helper";
import { parseBody, validate, validateQuery } from "../../../common/middlewares";
import {
  createBodySchema,
  updateBodySchema,
  idParamsSchema,
  extractAndCreateBodySchema,
  importRecordsBodySchema,
  listQuerySchema,
} from "./cv.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

// cv routes

router.post("/extract-and-create", validateBody(extractAndCreateBodySchema), handleController(extractAndCreate));
router.get("/extract/:id", validateParams(idParamsSchema), handleController(extract));
router.get("/", validateQuery(listQuerySchema), handleController(list));
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.get("/:id/resume-url", validateParams(idParamsSchema), handleController(resumeUrl));
// No body: the CV is read on the server; see importToProfile.
router.post("/:id/import-to-profile", validateParams(idParamsSchema), handleController(importToProfile));
// The rows the candidate ticked after an import; parseBody keeps the trimmed, defaulted body.
router.post("/import-records", parseBody(importRecordsBodySchema), handleController(importRecords));
router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
