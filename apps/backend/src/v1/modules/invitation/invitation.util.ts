import { BadRequestException } from "../../../common/helper";
import { ACCOUNT_TYPE_ENUMS, VERIFICATION_TOKEN_TYPE_ENUMS } from "@rl/types";

export const getVerificationTokenType = (userType: ACCOUNT_TYPE_ENUMS) => {
  switch (userType) {
    case ACCOUNT_TYPE_ENUMS.EMPLOYER:
      return VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_CLIENT_ORG;
    case ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN:
      return VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_INTERFACE_NRM;
    default:
      throw new Error("Invalid user type");
  }
};

export const getUserTypeFromVerificationTokenType = (type: VERIFICATION_TOKEN_TYPE_ENUMS) => {
  switch (type) {
    case VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_CLIENT_ORG:
      return ACCOUNT_TYPE_ENUMS.EMPLOYER;
    case VERIFICATION_TOKEN_TYPE_ENUMS.INVITATION_IN_INTERFACE_NRM:
      return ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN;
    default:
      throw new Error("Invalid verification token type");
  }
};
