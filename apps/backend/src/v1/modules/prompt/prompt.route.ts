import express from "express";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import {
  createBodySchema,
  updateBodySchema,
  idParamsSchema,
  labelParamsSchema,
  setLabelBodySchema,
  resolveQuerySchema,
} from "./prompt.validation";
import {
  list,
  listNames,
  resolve,
  get,
  create,
  update,
  setLabel,
  removeLabel,
  softRemove,
  hardRemove,
  restore,
} from "./prompt.controller";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");
const validateQuery = validate("query");

// prompt routes
// `/names` and `/resolve` are declared before `/:id`, or the param route
// swallows them.
router.get("/", handleController(list));
router.get("/names", handleController(listNames));
router.get("/resolve", validateQuery(resolveQuerySchema), handleController(resolve));
router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.post("/", validateBody(createBodySchema), handleController(create));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));

// publish / rollback — a label move is the only way a stored prompt reaches the runtime
router.put(
  "/:name/labels/:label",
  validateParams(labelParamsSchema),
  validateBody(setLabelBodySchema),
  handleController(setLabel)
);
router.delete("/:name/labels/:label", validateParams(labelParamsSchema), handleController(removeLabel));

router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
