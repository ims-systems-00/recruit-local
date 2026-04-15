import express from "express";
import { validate } from "../../../common/middlewares";
import { handleController } from "../../../common/helper";
import { idParamsSchema } from "../user/user.validation";
import { list, get, create, update, softRemove, hardRemove, restore } from "./favourite.controller";
import { createFavouriteBodySchema, updateFavouriteBodySchema, favouriteListQuerySchema } from "./favourite.validation";

const router = express.Router();

const validateBody = validate("body");
const validateParams = validate("params");
const validateQuery = validate("query");

router.post("/", validateBody(createFavouriteBodySchema), handleController(create));
router.get("/", validateQuery(favouriteListQuerySchema), handleController(list));

router.get("/:id", validateParams(idParamsSchema), handleController(get));
router.put("/:id", validateParams(idParamsSchema), validateBody(updateFavouriteBodySchema), handleController(update));

router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));
router.delete("/:id/hard", validateParams(idParamsSchema), handleController(hardRemove));
router.put("/:id/restore", validateParams(idParamsSchema), handleController(restore));

export default router;
