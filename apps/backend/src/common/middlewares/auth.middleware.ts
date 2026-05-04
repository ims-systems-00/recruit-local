import { Request, Response, NextFunction } from "express";
import { catchAsync, UnauthorizedException } from "../helper";
import * as userService from "../../v1/modules/user/user.service";
import * as tokenService from "../../v1/modules/token/token.service";
import { CustomJwtPayload } from "../../v1/modules/token/token.interface";
import "../../types/request-extension";
import { IUserDoc } from "../../models";

// deserializeUser middleware
export const deserializeUser = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Getting token from cookies or request header
  const accessToken = req.cookies?.__imsat__ || req.header("x-auth-access-token");
  if (!accessToken) {
    return next(new UnauthorizedException("No access token, Please login to get access."));
  }

  // Verify access token
  const decoded = (await tokenService.verifyAccessToken(accessToken)) as CustomJwtPayload;

  if (!decoded.id || !decoded.iat) {
    return next(new UnauthorizedException("Invalid access token."));
  }

  // Check if access token exists in the database
  const isExists = await tokenService.findAccessToken({ token: accessToken, userId: decoded.id });
  if (!isExists) {
    return next(new UnauthorizedException("Access token is no longer valid."));
  }

  // Check if user still exists
  let currentUser: IUserDoc | null = null;
  try {
    currentUser = await userService.getUserById(decoded.id);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An error occurred";
    return next(new UnauthorizedException(errorMessage));
  }

  if (!currentUser) {
    return next(new UnauthorizedException("User not found."));
  }

  // Check if user changed password after the token was issued
  if (currentUser.passwordChangeAfter(decoded.iat.toString())) {
    return next(new UnauthorizedException("User recently changed password! Please log in again."));
  }

  // Access protected route
  req.session = {
    user: {
      _id: String(currentUser._id),
      fullName: currentUser.fullName,
      type: currentUser.type,
      role: currentUser.role,
    },
    tenantId: currentUser.tenantId?.toString(),
    jobProfileId: currentUser.jobProfileId?.toString(),
  };

  next();
});
