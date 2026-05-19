import { Request, Response, NextFunction } from "express";
import { catchAsync, UnauthorizedException } from "../helper";
import { EMAIL_VERIFICATION_STATUS_ENUMS } from "../../models/constants";

export const emailVerified = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  if (req.session?.user.emailVerificationStatus !== EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED) {
    return next(new UnauthorizedException("Email verification required to access this resource."));
  }

  next();
});
