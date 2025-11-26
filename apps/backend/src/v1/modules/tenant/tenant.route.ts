import express from "express";
import {
  listTenant,
  getTenant,
  createTenant,
  hardRemoveTenant,
  softRemoveTenant,
  restoreTenant,
  updateTenant,
  updateTenantLogo,
  bulkRemoveTenants,
  getAllUsersByTenantId,
} from "./tenant.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import {
  createBodySchema,
  updateBodySchema,
  idParamsSchema,
  logoUpdateParamsSchema,
  logoUpdateBodySchema,
  bulkDeleteBodySchema,
} from "./tenant.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listTenant));
router.get("/:id", validateParams(idParamsSchema), handleController(getTenant));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(updateTenant));

router.post("/", validateBody(createBodySchema), handleController(createTenant));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveTenant));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveTenant));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreTenant));

router.put(
  "/:id/:logoStorage",
  validateParams(logoUpdateParamsSchema),
  validateBody(logoUpdateBodySchema),
  handleController(updateTenantLogo)
);

router.post("/bulk-delete-ops/", validateBody(bulkDeleteBodySchema), handleController(bulkRemoveTenants));
router.get("/:id/users", validateParams(idParamsSchema), handleController(getAllUsersByTenantId));

export default router;
