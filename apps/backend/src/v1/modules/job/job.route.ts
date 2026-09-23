import express from "express";
import { handleController } from "../../../common/helper";
import { validate, validateQuery } from "../../../common/middlewares";
import { createBodySchema, updateBodySchema, idParamsSchema, listQuerySchema } from "./job.validation";
import { list, get, create, update, softRemove, hardRemove, restore } from "./job.controller";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

// job routes
router.get("/", validateQuery(listQuerySchema), handleController(list));
// Applications for a job are served by GET /applications?jobId=<id>, which gates on
// ApplicationAbilityBuilder and scopes the query to the caller. A second, job-scoped
// route here only ever re-implemented that check less carefully.
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
