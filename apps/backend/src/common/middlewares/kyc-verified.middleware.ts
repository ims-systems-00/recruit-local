import { Request, Response, NextFunction } from "express";
import { catchAsync, UnauthorizedException } from "../helper";
import { KYC_STATUS } from "@rl/types";

export const kycVerified = catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
  if (req.session?.user.kycStatus !== KYC_STATUS.VERIFIED) {
    return next(new UnauthorizedException("KYC verification required to access this resource."));
  }

  next();
});
