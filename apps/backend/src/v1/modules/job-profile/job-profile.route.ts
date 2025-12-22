import express from "express";
import {
  listJobProfile,
  getJobProfile,
  hardRemoveJobProfile,
  softRemoveJobProfile,
  restoreJobProfile,
  updateJobProfile,
  createJobProfile,
} from "./job-profile.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { updateBodySchema, idParamsSchema, createBodySchema } from "./job-profile.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

// job profile routes
router.get("/", handleController(listJobProfile));
router.get("/:id", validateParams(idParamsSchema), handleController(getJobProfile));
router.post("/", validateBody(createBodySchema), handleController(createJobProfile));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(updateJobProfile));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveJobProfile));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveJobProfile));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreJobProfile));

export default router;
