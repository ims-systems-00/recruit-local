import { Request, Response, NextFunction } from "express";
import { ACCOUNT_TYPE_ENUMS } from "@rl/types";
import { ForbiddenException } from "../helper";
import "../../types/request-extension";

/**
 * Restricts a route to platform admins.
 *
 * Must run after `deserializeUser` — it reads `req.session`, which only that
 * middleware sets. Mounted on its own rather than folded into an ability
 * builder because the surfaces it guards (the BullMQ dashboard) are operational
 * tooling, not CASL-modelled domain entities.
 */
export const platformAdminOnly = (req: Request, res: Response, next: NextFunction) => {
  if (req.session?.user?.type !== ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
    return next(new ForbiddenException("Platform admin access required."));
  }

  next();
};
