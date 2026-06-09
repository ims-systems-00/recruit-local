import express from "express";
import {
  list,
  get,
  getMySurvey,
  upsert,
  update,
  softRemove,
  hardRemove,
  restore,
} from "./user-interest-survey.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { upsertBodySchema, updateBodySchema, idParamsSchema } from "./user-interest-survey.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(list));
router.get("/me", handleController(getMySurvey));
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.post("/", validateBody(upsertBodySchema), handleController(upsert));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
