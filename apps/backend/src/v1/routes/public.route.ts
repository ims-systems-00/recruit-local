import express from "express";
import { handleController } from "../../common/helper";
import { validate } from "../../common/middlewares";
import { idParamsSchema } from "../modules/job/job.validation";
import { publicList, publicGet } from "../modules/job/job.controller";

const router = express.Router();
const validateParams = validate("params");

router.get("/jobs", handleController(publicList));
router.get("/jobs/:id", validateParams(idParamsSchema), handleController(publicGet));

export default router;
