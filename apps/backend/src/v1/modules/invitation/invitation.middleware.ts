import { Request, Response, NextFunction } from "express";
import { catchAsync, BadRequestException } from "../../../common/helper";
import * as userService from "../user/user.service";
import * as verificationTokenService from "../verification-token";
import { MEMBERSHIP_ROLE_ENUMS, USER_TYPE_ENUMS } from "../../../models/constants";
import { Membership } from "../../../models";

export const preInviteValidation = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const invitations = req.body;
  const userType = req.session.user?.type;

  await Promise.all(
    invitations.map(async ({ email, tenantId }) => {
      const isUserExists = await userService.getUserByEmail(email);
      if (isUserExists)
        throw new BadRequestException(
          `User with email ${email} already joined the organization. Please review the list and try again.`
        );

      const invitationToken = await verificationTokenService.findOne({ email });
      if (invitationToken) await verificationTokenService.remove({ email });

      if (userType === USER_TYPE_ENUMS.PLATFORM_ADMIN) return;

      const isMembership = await Membership.findOne({
        userId: req.session.user?._id,
        tenantId,
        role: MEMBERSHIP_ROLE_ENUMS.ADMIN,
      });
      if (!isMembership) {
        throw new BadRequestException(`You are not a member of the organization with id ${tenantId}.`);
      }
    })
  );

  next();
});
