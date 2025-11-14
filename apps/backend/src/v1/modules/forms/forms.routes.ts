import express from "express";
import formRoutes from "./form/form.route";
import formElementRoutes from "./form-element/form-element.route";
import formSubmissionRoutes from "./form-submission/form-submission.route";
import { validate } from "../../../common/middlewares";
import { formIdParamsSchema } from "./forms.validation";

const router = express.Router();
const validateParams = validate("params");

router.use("/", formRoutes);
router.use("/:formId/elements", validateParams(formIdParamsSchema), formElementRoutes);
router.use("/:formId/submissions", validateParams(formIdParamsSchema), formSubmissionRoutes);

export default router;
