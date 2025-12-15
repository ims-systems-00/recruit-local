import * as tokenService from "../token";
import * as userService from "../user";
import * as verificationTokenService from "../verification-token";
import { AccountRecoveryEmail, AccountVerificationEmail } from "../email";
import { CustomJwtPayload } from "../token";
import { IUserDoc } from "../../../models";
import { BadRequestException, logger, NotFoundException, SessionExpiredException } from "../../../common/helper";
import { VERIFICATION_TOKEN_TYPE_ENUMS, EMAIL_VERIFICATION_STATUS_ENUMS } from "../../../models/constants";
import {
  GenerateSendAndStoreRegistrationTokenInput,
  VerifyRecoveryInput,
  LoginInput,
  RefreshAccessTokenInput,
  LogoutInput,
  UserPayload,
} from "./auth.interface";

export const _generateSendAndStoreRegistrationToken = async ({
  userId,
  receiver,
}: GenerateSendAndStoreRegistrationTokenInput): Promise<void> => {
  const registrationToken = tokenService.generateToken({
    payload: { id: userId },
    options: { expiresIn: process.env.REGISTRATION_TOKEN_EXPIRY },
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
  const decoded = (await tokenService.verifyToken(payload.invitationToken)) as CustomJwtPayload;
  payload.email = decoded.email;
  payload.type = decoded.userType;
  payload.tenantId = decoded.tenantId as any;
  payload.role = decoded.role;

  // verified the email
  const user = await userService.createUser(payload);
  user.emailVerificationStatus = EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED;
  await user.save();

  // Remove the invitation token from the database
  await verificationTokenService.remove({ _id: isTokenExists._id.toString() });

  return user;
};

const handleDirectRegistration = async (payload: UserPayload): Promise<IUserDoc> => {
  const isExists = await userService.getUserByEmail(payload.email);
  if (isExists) throw new BadRequestException("Email already exists.");

  const user = await userService.createUser(payload);
  // await _generateSendAndStoreRegistrationToken({ userId: user._id.toString(), receiver: user.email });

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
  if (!user) throw new BadRequestException("User not found.");

  const isMatch = await user.correctPassword(password);
  if (!isMatch) throw new BadRequestException("Invalid email or password.");

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

  const user = await userService.getUser(decoded.id);

  user.emailVerificationStatus = EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED;
  await user.save();

  await verificationTokenService.remove({ _id: isExists._id.toString() });

  return user;
};

export const resendVerification = async (email: string): Promise<IUserDoc> => {
  const user = await userService.getUserByEmail(email);
  if (!user) throw new NotFoundException("User not found.");

  if (user.emailVerificationStatus === EMAIL_VERIFICATION_STATUS_ENUMS.VERIFIED) {
    throw new BadRequestException("Email is already verified.");
  }

  await _generateSendAndStoreRegistrationToken({ userId: user._id.toString(), receiver: user.email });

  return user;
};

export const recoverAccount = async (email: string): Promise<IUserDoc> => {
  const user = await userService.getUserByEmail(email);
  if (!user) throw new NotFoundException("User not found.");

  const recoveryToken = tokenService.generateToken({
    payload: { id: user._id.toString() },
    options: { expiresIn: process.env.RECOVERY_TOKEN_EXPIRY },
  });

  const recoveryLink = `${process.env.CLIENT_URL}/reset-password?recovery_token=${recoveryToken}`;

  const emailObj = new AccountRecoveryEmail({ link: recoveryLink });
  emailObj.to(email).send();

  await verificationTokenService.create({ token: recoveryToken, type: VERIFICATION_TOKEN_TYPE_ENUMS.FORGOT_PASS });

  return user;
};

export const verifyRecovery = async ({
  token,
  password,
  accessToken,
  refreshToken,
}: VerifyRecoveryInput): Promise<IUserDoc> => {
  // Remove the previous tokens if the user is logged in
  await tokenService.removeTokensPair({ accessToken, refreshToken });

  const isExists = await verificationTokenService.findOne({
    token,
    type: VERIFICATION_TOKEN_TYPE_ENUMS.FORGOT_PASS,
  });
  if (!isExists) throw new BadRequestException("Invalid or expired token.");

  const decoded = (await tokenService.verifyToken(token)) as CustomJwtPayload;

  const user = await userService.getUser(decoded.id);
  user.password = password;
  await user.save();
  await verificationTokenService.remove({ _id: isExists._id.toString() });

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
  const user = await userService.getUser(decoded.id);

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
