import { AuthUserResponseDto } from "@rl/types";
import { IUserDoc } from "../../../models";

/**
 * Serializes the authenticated user into the canonical public shape shared by
 * every auth flow (register, login, verify, recover, refresh). ObjectIds become
 * strings and the password is never exposed.
 */
export const toAuthUserResponse = (user: IUserDoc): AuthUserResponseDto => ({
  _id: String(user._id),
  id: String(user.id ?? user._id),
  firstName: user.firstName,
  lastName: user.lastName,
  fullName: user.fullName,
  email: user.email,
  emailVerificationStatus: user.emailVerificationStatus,
  type: user.type ?? null,
  role: user.role ?? null,
  tenantId: user.tenantId != null ? String(user.tenantId) : null,
  jobProfileId: user.jobProfileId != null ? String(user.jobProfileId) : null,
  kycStatus: user.kycStatus,
});
