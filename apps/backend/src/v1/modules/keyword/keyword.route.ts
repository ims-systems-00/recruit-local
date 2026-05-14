import express from "express";
import { list, create, search, softRemove } from "./keyword.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { createBodySchema, searchQuerySchema, idParamsSchema } from "./keyword.validation";

const router = express.Router();
const validateBody = validate("body");
const validateParams = validate("params");
const validateQuery = validate("query");

router.get("/", handleController(list));
router.get("/search", validateQuery(searchQuerySchema), handleController(search));
router.post("/", validateBody(createBodySchema), handleController(create));
router.delete("/:id/soft", validateParams(idParamsSchema), handleController(softRemove));

export default router;
