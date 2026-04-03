import express from "express";
import {
  list,
  getOne,
  create,
  update,
  softRemove,
  hardRemove,
  restore,
  listSoftDeleted,
  getOneSoftDeleted,
  updateUserProfileImage,
} from "./user.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { updateBodySchema, idParamsSchema, profileImageBodySchema } from "./user.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

// List & Create
router.get("/", handleController(list));
router.post("/", handleController(create));

// Trash (Must come before /:id routes)
router.get("/trash", handleController(listSoftDeleted));
router.get("/trash/:id", validateParams(idParamsSchema), handleController(getOneSoftDeleted));

// Read & Update
router.get("/:id", validateParams(idParamsSchema), handleController(getOne));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(update));

// Deletion & Restoration
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

// Custom
router.put(
  "/:id/profile-image",
  validateParams(idParamsSchema),
  validateBody(profileImageBodySchema),
  handleController(updateUserProfileImage)
);

export default router;
