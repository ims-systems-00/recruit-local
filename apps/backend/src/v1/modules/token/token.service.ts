import jwt from "jsonwebtoken";
import { TokenPair, ITokenPairDoc, IUserDoc } from "../../../models";
import { BadRequestException, UnauthorizedException } from "../../../common/helper";
import {
  CustomJwtPayload,
  GenerateTokenOptions,
  TokensInput,
  FindTokenInput,
  QuotationTokenPayload,
} from "./token.interface";
export const generateTokensPair = (payload: CustomJwtPayload) => {
  const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET! as string, {
    expiresIn: parseInt(process.env.ACCESS_TOKEN_EXPIRY as string),
  });

  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET! as string, {
    expiresIn: parseInt(process.env.REFRESH_TOKEN_EXPIRY as string),
  });

  return { accessToken, refreshToken };
};

export const storeTokens = async ({
  accessToken,
  refreshToken,
  userId,
}: TokensInput): Promise<ITokenPairDoc | null> => {
  let tokenPair = await TokenPair.findOne({ userId });

  if (tokenPair) {
    tokenPair.accessTokens.push(accessToken);
    tokenPair.refreshTokens.push(refreshToken);
  } else {
    tokenPair = new TokenPair({
      userId,
      accessTokens: [accessToken],
      refreshTokens: [refreshToken],
    });
  }

  return tokenPair.save();
};

export const generateAndStoreTokensPair = async (payload: CustomJwtPayload) => {
  const { accessToken, refreshToken } = generateTokensPair(payload);
  await storeTokens({ accessToken, refreshToken, userId: payload.id });

  return { accessToken, refreshToken };
};
export const getTokenPairForUser = async (user: IUserDoc) => {
  const tokenPayload: CustomJwtPayload = {
    id: user._id?.toString(),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    tenantId: user.tenantId?.toString(),
    role: user.role,
  };
  return generateAndStoreTokensPair(tokenPayload);
};

export const removeTokensPair = async ({ accessToken, refreshToken }: TokensInput) => {
  return TokenPair.findOneAndUpdate(
    { accessTokens: { $in: accessToken }, refreshTokens: { $in: refreshToken } },
    { $pull: { accessTokens: accessToken, refreshTokens: refreshToken } },
    { new: true }
  );
};

export const removeAllTokenPairs = async (userId: string) => {
  return TokenPair.deleteMany({ userId });
};

export const findRefreshToken = async ({ token, userId }: FindTokenInput) => {
  return TokenPair.findOne({ userId, refreshTokens: { $in: token } });
};

export const findAccessToken = async ({ token, userId }: FindTokenInput) => {
  return TokenPair.findOne({ userId, accessTokens: { $in: token } });
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
