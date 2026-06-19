import express from "express";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createPostBodySchema, updatePostBodySchema, postIdParamsSchema } from "./post.validation";
import { list, getOne, create, update, softRemove, hardRemove, restore } from "./post.controller";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");

// post routes
router.get("/", handleController(list));
router.get("/:id", validateParams(postIdParamsSchema), handleController(getOne));
router.post("/", validateBody(createPostBodySchema), handleController(create));
router.put("/:id", validateParams(postIdParamsSchema), validateBody(updatePostBodySchema), handleController(update));
router.delete("/:id/soft", validateParams(postIdParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(postIdParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(postIdParamsSchema), handleController(restore));

export default router;
