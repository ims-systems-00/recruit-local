import express from "express";
import { validate } from "../../../common/middlewares";
import { handleController } from "../../../common/helper";
import {
  createSkillAssessmentBodySchema,
  updateSkillAssessmentBodySchema,
  skillAssessmentListQuerySchema,
} from "./skill-assessment.validation";

import { idParamsSchema } from "../user/user.validation";

import { list, get, create, update, softRemove, hardRemove, restore } from "./skill-assessment.controller";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");
const validateQuery = validate("query");

router.post("/", validateBody(createSkillAssessmentBodySchema), handleController(create));
router.get("/", validateQuery(skillAssessmentListQuerySchema), handleController(list));

router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.put(
  "/:id",
  validateParams(idParamsSchema),
  validateBody(updateSkillAssessmentBodySchema),
  handleController(update)
);

router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
