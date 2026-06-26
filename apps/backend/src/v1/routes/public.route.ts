import express from "express";
import { handleController } from "../../common/helper";
import { validate } from "../../common/middlewares";
import { idParamsSchema } from "../modules/job/job.validation";
import { publicList, publicGet } from "../modules/job/job.controller";
import { idParamsSchema as salaryIdParamsSchema } from "../modules/salary/salary.validation";
import { list as salaryList, get as salaryGet } from "../modules/salary/salary.controller";

const router = express.Router();
const validateParams = validate("params");

router.get("/jobs", handleController(publicList));
router.get("/jobs/:id", validateParams(idParamsSchema), handleController(publicGet));

router.get("/salaries", handleController(salaryList));
router.get("/salaries/:id", validateParams(salaryIdParamsSchema), handleController(salaryGet));

export default router;
