import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Session, ISessionDoc, IUserDoc } from "../../../models";
import { BadRequestException, UnauthorizedException } from "../../../common/helper";
import { hashToken, sessionExpiry } from "./session-token";
import {
  CustomJwtPayload,
  GenerateTokenOptions,
  TokensInput,
  FindTokenInput,
  QuotationTokenPayload,
} from "./token.interface";

// random jwtid so two tokens signed in the same second still differ
export const generateTokensPair = (payload: CustomJwtPayload) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET! as string, {
    expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY as string),
    jwtid: crypto.randomUUID(),
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET! as string, {
    expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRY as string),
    jwtid: crypto.randomUUID(),
  });

  return { accessToken, refreshToken };
};

export const storeTokens = async ({
  accessToken,
  refreshToken,
  userId,
}: TokensInput): Promise<ISessionDoc> => {
  return Session.create({
    userId,
    accessHash: hashToken(accessToken),
    refreshHash: hashToken(refreshToken),
    expiresAt: sessionExpiry(refreshToken),
  });
};

export const generateAndStoreTokensPair = async (payload: CustomJwtPayload) => {
  const { accessToken, refreshToken } = generateTokensPair(payload);
  await storeTokens({ accessToken, refreshToken, userId: payload.id });

  return { accessToken, refreshToken };
};
const toTokenPayload = (user: IUserDoc): CustomJwtPayload => ({
  id: user._id?.toString(),
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  tenantId: user.tenantId?.toString(),
  role: user.role,
});

export const getTokenPairForUser = async (user: IUserDoc) => {
  return generateAndStoreTokensPair(toTokenPayload(user));
};

// swaps in a new pair on the same session, null if that refresh token was already used
export const rotateTokenPair = async (user: IUserDoc, refreshToken: string) => {
  const { accessToken, refreshToken: newRefreshToken } = generateTokensPair(toTokenPayload(user));

  const session = await Session.findOneAndUpdate(
    { userId: user._id, refreshHash: hashToken(refreshToken) },
    {
      accessHash: hashToken(accessToken),
      refreshHash: hashToken(newRefreshToken),
      expiresAt: sessionExpiry(newRefreshToken),
    }
  );
  if (!session) return null;

  return { accessToken, refreshToken: newRefreshToken };
};

export const removeTokensPair = async ({ accessToken, refreshToken }: TokensInput) => {
  if (!accessToken || !refreshToken) return null;

  return Session.findOneAndDelete({ accessHash: hashToken(accessToken), refreshHash: hashToken(refreshToken) });
};

export const removeAllTokenPairs = async (userId: string) => {
  return Session.deleteMany({ userId });
};

export const findAccessToken = async ({ token, userId }: FindTokenInput) => {
  return Session.findOne({ userId, accessHash: hashToken(token) });
};

export const verifyAccessToken = (accessToken: string): Promise<CustomJwtPayload | string> => {
  return new Promise((resolve, reject) => {
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET as string, (err, decoded) => {
      if (err) {
        return reject(new UnauthorizedException("Invalid or expired access token."));
      }
      resolve(decoded as CustomJwtPayload | string);
    });
  });
};

export const verifyRefreshToken = (refreshToken: string): Promise<CustomJwtPayload | string> => {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET as string, (err, decoded) => {
      if (err) {
        return reject(new UnauthorizedException("Invalid or expired refresh token."));
      }
      resolve(decoded as CustomJwtPayload | string);
    });
  });
};

export const generateToken = ({ payload, options }: { payload: CustomJwtPayload; options: GenerateTokenOptions }) => {
  return jwt.sign(payload, process.env.JWT_KEY as string, {
    expiresIn: parseInt(options.expiresIn as string),
    jwtid: crypto.randomUUID(),
  });
};

export const verifyToken = (token: string): Promise<CustomJwtPayload | string> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_KEY as string, (err, decoded) => {
      if (err) {
        return reject(new BadRequestException("Invalid or expired token."));
      }
      resolve(decoded as CustomJwtPayload | string);
    });
  });
};

export const generateQuotationToken = ({
  payload,
  options,
}: {
  payload: QuotationTokenPayload;
  options: GenerateTokenOptions;
}) => {
  return jwt.sign(payload, process.env.JWT_KEY as string, {
    expiresIn: parseInt(options.expiresIn as string),
  });
};

export const verifyQuotationToken = (token: string): Promise<QuotationTokenPayload | string> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.JWT_KEY as string, (err, decoded) => {
      if (err) {
        return reject(new BadRequestException("Invalid or expired token."));
      }
      resolve(decoded as QuotationTokenPayload | string);
    });
  });
};
