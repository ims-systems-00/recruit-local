import { StatusCodes } from "http-status-codes";
import * as authService from "./auth.service";
import * as tokenService from "../token";
import { ApiResponse, ControllerParams } from "../../../common/helper";
import { UserPayload } from "./auth.interface";
import { pick } from "../../../common/helper";

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "None",
  maxAge: 10 * 60 * 60 * 24 * 1000, // 10 days
};

export const registration = async ({ req }: ControllerParams): Promise<ApiResponse> => {
  const payload: UserPayload = {
    ...pick(req.body, ["firstName", "lastName", "email", "password", "invitationToken"]),
    tenantId: req.body.tenantId ?? null,
  };
  payload.fullName = `${payload.firstName} ${payload.lastName}`;

  const user = await authService.register(payload);

  const responseMessage = payload.invitationToken
    ? "Account successfully created."
    : "Account verification link sent to your email.";

  return new ApiResponse({
    message: responseMessage,
    statusCode: StatusCodes.CREATED,
    data: pick(user, ["_id", "firstName", "lastName", "fullName", "email", "emailVerificationStatus", "type"]),
    fieldName: "user",
  });
};

export const login = async ({ req }: ControllerParams): Promise<ApiResponse> => {
  const accessToken = req.cookies?.__imsat__ || req.header("x-auth-access-token");
  const refreshToken = req.cookies?.__imsrt__ || req.header("x-auth-refresh-token");

  const { email, password } = req.body;
  const user = await authService.login({ email, password, accessToken, refreshToken });
  const { accessToken: accessTokenRes, refreshToken: refreshTokenRes } = await tokenService.getTokenPairForUser(user);

  const responseData = {
    ...pick(user, ["id", "firstName", "lastName", "fullName", "email", "emailVerificationStatus", "type", "role"]),
    accessToken: accessTokenRes,
    refreshToken: refreshTokenRes,
  };

  return new ApiResponse({
    message: "User logged in successfully.",
    statusCode: StatusCodes.OK,
    data: responseData,
    fieldName: "user",
    cookies: [
      {
        name: "__imsat__",
        value: accessTokenRes,
        options: cookieOptions,
      },
      {
        name: "__imsrt__",
        value: refreshTokenRes,
        options: cookieOptions,
      },
    ],
  });
};

export const logout = async ({ req }: ControllerParams): Promise<ApiResponse> => {
  const accessToken = req.cookies?.__imsat__ || req.header("x-auth-access-token");
  const refreshToken = req.cookies?.__imsrt__ || req.header("x-auth-refresh-token");

  await authService.logout({ accessToken, refreshToken });

  return new ApiResponse({
    message: "User logged out successfully.",
    statusCode: StatusCodes.OK,
    clearCookie: ["__imsat__", "__imsrt__"],
  });
};

export const verifyRegistration = async ({ req }: ControllerParams): Promise<ApiResponse> => {
  const { registration_token } = req.query;

  const user = await authService.verifyRegistration(registration_token as string);
  const { accessToken, refreshToken } = await tokenService.getTokenPairForUser(user);

  const responseData = {
    ...pick(user, ["_id", "firstName", "lastName", "fullName", "email", "emailVerificationStatus", "type"]),
    accessToken,
    refreshToken,
  };

  return new ApiResponse({
    message: "Account verified successfully.",
    statusCode: StatusCodes.OK,
    data: responseData,
    fieldName: "user",
    cookies: [
      {
        name: "__imsat__",
        value: accessToken,
        options: cookieOptions,
      },
      {
        name: "__imsrt__",
        value: refreshToken,
        options: cookieOptions,
      },
    ],
  });
};

export const resendVerification = async ({ req }: ControllerParams): Promise<ApiResponse> => {
  const { email } = req.body;

  const user = await authService.resendVerification(email as string);

  return new ApiResponse({
    message: "Account verification link sent to your email.",
    statusCode: StatusCodes.OK,
    data: pick(user, ["_id", "firstName", "lastName", "fullName", "email", "emailVerificationStatus", "type"]),
    fieldName: "user",
  });
};

export const recoverAccount = async ({ req }: ControllerParams): Promise<ApiResponse> => {
  const { email } = req.body;

  await authService.recoverAccount(email);

  return new ApiResponse({
    message: "Password recovery link sent to your email.",
    statusCode: StatusCodes.OK,
  });
};

export const verifyRecovery = async ({ req }: ControllerParams): Promise<ApiResponse> => {
  const accessToken = req.cookies?.__imsat__ || req.header("x-auth-access-token");
  const refreshToken = req.cookies?.__imsrt__ || req.header("x-auth-refresh-token");
  const { recovery_token } = req.query;
  const { password } = req.body;

  const user = await authService.verifyRecovery({
    token: recovery_token as string,
    password,
    accessToken,
    refreshToken,
  });
  const { accessToken: accessTokenRes, refreshToken: refreshTokenRes } = await tokenService.getTokenPairForUser(user);

  const responseData = {
    ...pick(user, ["_id", "firstName", "lastName", "fullName", "email", "emailVerificationStatus", "type"]),
    accessToken: accessTokenRes,
    refreshToken: refreshTokenRes,
  };

  return new ApiResponse({
    message: "Account recovered successfully.",
    statusCode: StatusCodes.OK,
    data: responseData,
    fieldName: "user",
    cookies: [
      {
        name: "__imsat__",
        value: accessToken,
        options: cookieOptions,
      },
      {
        name: "__imsrt__",
        value: refreshToken,
        options: cookieOptions,
      },
    ],
  });
};

export const refreshAccessToken = async ({ req }: ControllerParams): Promise<ApiResponse> => {
  // get the tokens from the cookies
  const refreshToken = req.cookies?.__imsrt__ || req.header("x-auth-refresh-token");
  const accessToken = req.cookies?.__imsat__ || req.header("x-auth-access-token");

  const user = await authService.refreshAccessToken({ refreshToken, accessToken });
  if (!user) {
    return new ApiResponse({
      message: "Reuse of refresh token.",
      statusCode: StatusCodes.FORBIDDEN,
      clearCookie: ["__imsat__", "__imsrt__"],
    });
  }

  const { accessToken: accessTokenRes, refreshToken: refreshTokenRes } = await tokenService.getTokenPairForUser(user);
  const responseData = {
    user: {
      ...pick(user, ["_id", "firstName", "lastName", "fullName", "email", "emailVerificationStatus", "type"]),
      role: user.role,
    },
    tenantId: user.tenantId,
    accessToken: accessTokenRes,
    refreshToken: refreshTokenRes,
  };

  return new ApiResponse({
    message: "Access token refreshed successfully.",
    statusCode: StatusCodes.OK,
    data: responseData,
    fieldName: "session",
    cookies: [
      {
        name: "__imsat__",
        value: accessTokenRes,
        options: cookieOptions,
      },
      {
        name: "__imsrt__",
        value: refreshTokenRes,
        options: cookieOptions,
      },
    ],
  });
};
