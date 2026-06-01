import { JwtPayload } from "jsonwebtoken";
import { ACCOUNT_TYPE_ENUMS, USER_ROLE_ENUMS } from "@rl/types";

export interface GenerateTokenOptions {
  expiresIn: string | number;
}

export interface TokensInput {
  accessToken: string;
  refreshToken: string;
  userId?: string;
}

export interface FindTokenInput {
  token: string;
  userId: string;
}

export interface CustomJwtPayload extends JwtPayload {
  id?: string;
  tenantId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: USER_ROLE_ENUMS;
  type?: ACCOUNT_TYPE_ENUMS;
}

export interface QuotationTokenPayload extends JwtPayload {
  quotationId: string;
  userId: string;
  fullName: string;
  email: string;
}
