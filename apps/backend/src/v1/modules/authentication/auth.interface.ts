import { UserInput } from "../../../models";

export interface GenerateSendAndStoreRegistrationTokenInput {
  userId: string;
  receiver: string;
}

export interface VerifyRecoveryInput {
  token: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

export interface UserPayload extends UserInput {
  fullName?: string;
  invitationToken?: string;
}

export interface RefreshAccessTokenInput {
  refreshToken: string;
  accessToken: string;
}

export interface LoginInput {
  email: string;
  password: string;
  accessToken: string;
  refreshToken: string;
}

export interface LogoutInput {
  accessToken: string;
  refreshToken: string;
}
