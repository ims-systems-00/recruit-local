import express from "express";
import { validate } from "../../../common/middlewares";
import { handleController } from "../../../common/helper";
import { idParamsSchema } from "../user/user.validation";
import {
  createStatusBodySchema,
  updateStatusBodySchema,
  statusListQuerySchema,
  reorderStatusBodySchema,
} from "./status.validation";
import { list, get, create, update, reorder, softRemove, hardRemove, restore } from "./status.controller";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");
const validateQuery = validate("query");

router.post("/", validateBody(createStatusBodySchema), handleController(create));
router.get("/", validateQuery(statusListQuerySchema), handleController(list));
// Before `/:id`, which would otherwise take "reorder" as an id.
router.put("/reorder", validateBody(reorderStatusBodySchema), handleController(reorder));

router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateStatusBodySchema), handleController(update));

router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
