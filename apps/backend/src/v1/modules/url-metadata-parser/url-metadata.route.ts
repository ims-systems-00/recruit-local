import express from "express";
import { getMetadata } from "./url-metadata.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
import { querySchema } from "./url-metadata.validation";

const router = express.Router();
const validateQuery = validate("query");

router.get("/", validateQuery(querySchema), handleController(getMetadata));

export default router;
