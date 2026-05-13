import express from "express";
import { handleController } from "../../../common/helper";
import { list, get } from "./value.controller";

const router = express.Router();

// value routes
router.get("/", handleController(list));
router.get("/:id", handleController(get));

export default router;
