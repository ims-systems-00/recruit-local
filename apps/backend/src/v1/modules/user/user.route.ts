import express from "express";
import {
  listUser,
  getUser,
  hardRemoveUser,
  softRemoveUser,
  restoreUser,
  updateUser,
  updateUserProfileImage,
} from "./user.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { updateBodySchema, idParamsSchema, profileImageBodySchema } from "./user.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");

router.get("/", handleController(listUser));
router.get("/:id", validateParams(idParamsSchema), handleController(getUser));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateBodySchema), handleController(updateUser));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemoveUser));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemoveUser));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restoreUser));
router.put(
  "/:id/profile-image",
  validateParams(idParamsSchema),
  validateBody(profileImageBodySchema),
  handleController(updateUserProfileImage)
);

export default router;
