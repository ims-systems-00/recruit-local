import bcrypt from "bcryptjs";
import * as tokenService from "../token";
import * as userService from "../user";
import * as verificationTokenService from "../verification-token";
import { AccountRecoveryEmail, AccountVerificationEmail } from "../email";
import { CustomJwtPayload } from "../token";
import { IUserDoc } from "../../../models";
import { BadRequestException, logger, SessionExpiredException } from "../../../common/helper";
import { VERIFICATION_TOKEN_TYPE_ENUMS, EMAIL_VERIFICATION_STATUS_ENUMS } from "../../../models/constants";
import { ACCOUNT_TYPE_ENUMS } from "@rl/types";
import {
  GenerateSendAndStoreRegistrationTokenInput,
  VerifyRecoveryInput,
  LoginInput,
  RefreshAccessTokenInput,
  LogoutInput,
  UserPayload,
} from "./auth.interface";
import { isSelfRegisterableAccountType } from "./auth.constants";

/**
 * The single answer `/auth/login` gives for both a missing account and a wrong
 * password. Telling the two apart turns the endpoint into an oracle for which
 * email addresses are registered.
 */
const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

/**
 * Compared against when no user matches, so the miss costs roughly what a real
 * bcrypt check costs. Without it the "no such account" path returns noticeably
 * faster and the timing alone answers the same question. It is a real cost-12
 * hash of a throwaway string — nothing can match it.
 */
const DUMMY_PASSWORD_HASH = "$2a$12$bmx0O0vqtINeJ4uqf8.1Z.ScH3Urk1gxJvI/mbC8rSVl71HStvrKm";

/**
 * Registration may only ever produce an account type a visitor is allowed to
 * create for themselves. Platform admins come from the seeder, so no request to
 * this endpoint — invited or not — may set that type.
 */
const assertSelfRegisterableType = (type?: ACCOUNT_TYPE_ENUMS): void => {
  if (!isSelfRegisterableAccountType(type)) throw new BadRequestException("Invalid account type.");
};

export const _generateSendAndStoreRegistrationToken = async ({
  userId,
  receiver,
}: GenerateSendAndStoreRegistrationTokenInput): Promise<void> => {
  // delete any existing tokens for the user
  // await verificationTokenService.removeMany({ type: VERIFICATION_TOKEN_TYPE_ENUMS.USER_EMAIL, _id: userId });

  const registrationToken = tokenService.generateToken({
    payload: { id: userId },
    options: { expiresIn: process.env.REGISTRATION_TOKEN_EXPIRY! },
  });

  const verificationLink = `${process.env.CLIENT_URL}/accounts/registration-verification/?registration_token=${registrationToken}`;

  const email = new AccountVerificationEmail({ link: verificationLink });
  email.to(receiver).send();
  await verificationTokenService.create({ token: registrationToken, type: VERIFICATION_TOKEN_TYPE_ENUMS.USER_EMAIL });
};

const handleInvitationRegistration = async (payload: UserPayload): Promise<IUserDoc> => {
  // Check if the invitation token exists
  const isTokenExists = await verificationTokenService.findOne({ token: payload.invitationToken });
  if (!isTokenExists) throw new BadRequestException("Invalid invitation token.");

  // Replace the email and type from the invitation token
  const decoded = (await tokenService.verifyToken(payload.invitationToken!)) as CustomJwtPayload;
  payload.email = decoded.email!;
  payload.type = decoded.type;

  // An invitation cannot mint a platform admin either — those are seeded only.
  assertSelfRegisterableType(payload.type);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload.tenantId = decoded.tenantId as any;
  payload.role = decoded.role;

  // verified the email
  const user = await userService.create({ payload });
  user.emailVerificationStatus = EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED;
  await userService.update({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: { _id: user._id } as any,
    payload: { emailVerificationStatus: EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED },
  });

  // Remove the invitation token from the database
  await verificationTokenService.remove({ _id: isTokenExists._id!.toString() });

  return user;
};

const handleDirectRegistration = async (payload: UserPayload): Promise<IUserDoc> => {
  assertSelfRegisterableType(payload.type);

  const isExists = await userService.getUserByEmail(payload.email);
  if (isExists) throw new BadRequestException("Email already exists.");

  const user = await userService.create({ payload });
  await _generateSendAndStoreRegistrationToken({ userId: user._id.toString(), receiver: user.email });

  return user;
};

export const register = async (payload: UserPayload): Promise<IUserDoc> => {
  if (!payload.invitationToken) return handleDirectRegistration(payload);

  return handleInvitationRegistration(payload);
};

export const login = async ({ email, password, accessToken, refreshToken }: LoginInput): Promise<IUserDoc> => {
  // Remove the previous tokens if the user is logged in
  await tokenService.removeTokensPair({ accessToken, refreshToken });

  const user = await userService.getUserByEmail(email).select("+password");
  if (!user) {
    // Burn the same time a real check would, then fail with the same message.
    await bcrypt.compare(password, DUMMY_PASSWORD_HASH);
    throw new BadRequestException(INVALID_CREDENTIALS_MESSAGE);
  }

  const isMatch = await user.correctPassword(password);
  if (!isMatch) throw new BadRequestException(INVALID_CREDENTIALS_MESSAGE);

  return user;
};

export const logout = async ({ accessToken, refreshToken }: LogoutInput): Promise<void> => {
  await tokenService.removeTokensPair({ accessToken, refreshToken });
};

export const verifyRegistration = async (token: string): Promise<IUserDoc> => {
  const isExists = await verificationTokenService.findOne({
    token,
    type: VERIFICATION_TOKEN_TYPE_ENUMS.USER_EMAIL,
  });
  if (!isExists) throw new BadRequestException("Invalid or expired token.");

  const decoded = (await tokenService.verifyToken(token)) as CustomJwtPayload;

  const user = await userService.getUserById(decoded.id!);

  logger.debug(`User found for registration verification: ${user.email}`);

  user.emailVerificationStatus = EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED;
  await user.save();

  await verificationTokenService.remove({ _id: isExists._id!.toString() });

  return user;
};

/**
 * Returns nothing, and returns it the same way whether or not the address has an
 * account. The caller is unauthenticated and supplies only an email, so a 404
 * for "no such user" — or a distinct "already verified" error — would let anyone
 * test addresses, and the old `IUserDoc` return handed back that user's type,
 * role, tenant and KYC status on top.
 */
export const resendVerification = async (email: string): Promise<void> => {
  const user = await userService.getUserByEmail(email);
  if (!user) return;

  if (user.emailVerificationStatus === EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED) return;

  await _generateSendAndStoreRegistrationToken({ userId: user._id!.toString(), receiver: user.email });
};

/**
 * Silent on unknown addresses: the controller answers "recovery link sent"
 * either way. A 404 here would make this the easiest endpoint on the API for
 * harvesting which emails hold accounts.
 */
export const recoverAccount = async (email: string): Promise<void> => {
  const user = await userService.getUserByEmail(email);
  if (!user) return;

  const recoveryToken = tokenService.generateToken({
    payload: { id: user._id!.toString() },
    options: { expiresIn: process.env.RECOVERY_TOKEN_EXPIRY! },
  });

  const recoveryLink = `${process.env.CLIENT_URL}/reset-password?recovery_token=${recoveryToken}`;

  const emailObj = new AccountRecoveryEmail({ link: recoveryLink });
  emailObj.to(email).send();

  await verificationTokenService.create({ token: recoveryToken, type: VERIFICATION_TOKEN_TYPE_ENUMS.FORGOT_PASS });
};

export const verifyRecovery = async ({
  token,
  password,
  accessToken,
  refreshToken,
}: VerifyRecoveryInput): Promise<IUserDoc> => {
  // Removes only the caller's own pair, and only if they sent one. The full
  // revocation happens after the password is saved — see below.
  await tokenService.removeTokensPair({ accessToken, refreshToken });

  const isExists = await verificationTokenService.findOne({
    token,
    type: VERIFICATION_TOKEN_TYPE_ENUMS.FORGOT_PASS,
  });
  if (!isExists) throw new BadRequestException("Invalid or expired token.");

  const decoded = (await tokenService.verifyToken(token)) as CustomJwtPayload;

  const user = await userService.getUserById(decoded.id!);
  user.password = password;
  await user.save();
  await verificationTokenService.remove({ _id: isExists._id!.toString() });

  // A reset has to end every *other* session, not just the browser doing the
  // reset — which in the forgot-password flow is usually logged out anyway, so
  // the `removeTokensPair` above clears nothing. Someone resetting because their
  // account is compromised would otherwise leave the intruder signed in.
  //
  // Dropping the stored pairs is also what revokes the refresh tokens: a leaked
  // one then misses in `findRefreshToken` during `refreshAccessToken`, so it
  // cannot be traded for a fresh access token. Without this, the password change
  // alone does not stop it — `passwordChangeAt` is only consulted by
  // `deserializeUser`, and a refreshed token carries a new `iat` that passes.
  //
  // Runs before the caller mints its replacement pair, so the session that did
  // the reset stays signed in.
  await tokenService.removeAllTokenPairs(user._id.toString());

  return user;
};

export const refreshAccessToken = async ({
  refreshToken,
  accessToken,
}: RefreshAccessTokenInput): Promise<IUserDoc | null> => {
  // verify the refresh token
  let decoded: CustomJwtPayload;
  try {
    decoded = (await tokenService.verifyRefreshToken(refreshToken)) as CustomJwtPayload;
  } catch (err) {
    logger.error("Error in refreshAccessToken", err);
    throw new SessionExpiredException("Your session expired. Please login again.");
  }

  // Check if the user exists
  const user = await userService.getOne({
    query: { _id: decoded.id },
  });

  // Check reuse of refresh token and remove all the tokens
  const token = await tokenService.findRefreshToken({ token: refreshToken, userId: user._id.toString() });
  if (decoded && !token) {
    await tokenService.removeAllTokenPairs(user._id.toString());
    return null;
  }

  // Remove the tokens from the database
  await tokenService.removeTokensPair({
    accessToken,
    refreshToken,
  });

  return user;
};
