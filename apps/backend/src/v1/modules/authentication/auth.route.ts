import express from "express";
import {
  registration,
  login,
  logout,
  verifyRegistration,
  resendVerification,
  recoverAccount,
  verifyRecovery,
  refreshAccessToken,
} from "./auth.controller";
import { handleController } from "../../../common/helper";
import { validate, deserializeUser } from "../../../common/middlewares";
import {
  registerBodySchema,
  verifyRegistrationQuerySchema,
  resendVerificationBodySchema,
  recoverAccountBodySchema,
  verifyRecoveryQuerySchema,
  verifyRecoveryBodySchema,
  loginBodySchema,
  logoutCookieSchema,
  refreshAccessTokenCookieSchema,
} from "./auth.validation";

const router = express.Router();

const validateBody = validate("body");
const validateQuery = validate("query");
const validateCookies = validate("cookies");

router.post("/login", validateBody(loginBodySchema), handleController(login));
router.post("/registration", validateBody(registerBodySchema), handleController(registration));
router.post(
  "/registration/verification",
  validateQuery(verifyRegistrationQuerySchema),
  handleController(verifyRegistration)
);
router.post(
  "/registration/verification/email",
  validateBody(resendVerificationBodySchema),
  handleController(resendVerification)
);
router.post("/recovery", validateBody(recoverAccountBodySchema), handleController(recoverAccount));
router.post(
  "/recovery/verification",
  validateQuery(verifyRecoveryQuerySchema),
  validateBody(verifyRecoveryBodySchema),
  handleController(verifyRecovery)
);
// router.get(
//   "/refresh-access-token",
//   validateCookies(refreshAccessTokenCookieSchema),
//   handleController(refreshAccessToken)
// );
// router.delete("/logout", validateCookies(logoutCookieSchema), handleController(logout));
router.get("/refresh-access-token", handleController(refreshAccessToken));
router.delete("/logout", handleController(logout));

export default router;
