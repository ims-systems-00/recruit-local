import express from "express";
import { listInvitation, createInvitation, removeInvitation } from "./invitation.controller";
import { handleController } from "../../../common/helper";
import { validate } from "../../../common/middlewares";
// import { preInviteValidation } from "./invitation.middleware";
import { invitationBodySchema, invitationQuerySchema, idParamsSchema } from "./invitation.validation";

const router = express.Router();

const validateBody = validate("body");
const validateQuery = validate("query");
const validateParams = validate("params");

router.get("/", validateQuery(invitationQuerySchema), handleController(listInvitation));
router.post("/", validateBody(invitationBodySchema), handleController(createInvitation));
router.delete("/:id", validateParams(idParamsSchema), handleController(removeInvitation));

export default router;
