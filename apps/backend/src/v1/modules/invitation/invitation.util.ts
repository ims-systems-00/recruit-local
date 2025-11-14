import { BadRequestException } from "../../../common/helper";
import { USER_TYPE_ENUMS, VERIFICATION_TOKEN_TYPE_ENUMS } from "../../../models/constants";

export const getVerificationTokenType = (userType: USER_TYPE_ENUMS) => {
  switch (userType) {
    case USER_TYPE_ENUMS.CUSTOMER:
      return VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_CLIENT_ORG;
    case USER_TYPE_ENUMS.AUDITOR:
      return VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_AUDIT;
    case USER_TYPE_ENUMS.PLATFORM_ADMIN:
      return VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_INTERFACE_NRM;
    default:
      throw new Error("Invalid user type");
  }
};

export const getUserTypeFromVerificationTokenType = (type: VERIFICATION_TOKEN_TYPE_ENUMS) => {
  switch (type) {
    case VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_CLIENT_ORG:
      return USER_TYPE_ENUMS.CUSTOMER;
    case VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_AUDIT:
      return USER_TYPE_ENUMS.AUDITOR;
    case VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_INTERFACE_NRM:
      return USER_TYPE_ENUMS.PLATFORM_ADMIN;
    default:
      throw new Error("Invalid verification token type");
  }
};

export const checkValidationInInvitation = (userType: USER_TYPE_ENUMS) => {
  if (userType === USER_TYPE_ENUMS.AUDITOR && process.env.NODE_ENV === "production") {
    throw new BadRequestException("Invitation is not allowed for customer and auditor in production environment.");
  }
};
