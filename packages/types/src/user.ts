import {
  ACCOUNT_TYPE_ENUMS,
  EMAIL_VERIFICATION_STATUS_ENUMS,
  USER_ROLE_ENUMS,
} from './enums';
import { KYC_STATUS } from './kyc';

export interface User {
  _id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  profileImageSrc?: string;
  type?: string;
  role?: string;
  emailVerificationStatus?: string;
  createdAt?: string;
  updatedAt?: string;
  tenantId?: string | null;
  jobProfileId?: string | null;
  kycStatus?: string;
}

/**
 * Public HTTP shape of the authenticated user returned by the auth flows
 * (register, login, verify, recover, refresh). A fixed, canonical subset of the
 * user — every auth endpoint returns the same shape. ObjectIds are serialized
 * to strings; the `password` is never included.
 */
export interface AuthUserResponseDto {
  _id: string;
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  emailVerificationStatus: EMAIL_VERIFICATION_STATUS_ENUMS;
  type: ACCOUNT_TYPE_ENUMS | null;
  role: USER_ROLE_ENUMS | null;
  tenantId: string | null;
  jobProfileId: string | null;
  kycStatus?: KYC_STATUS;
}

/**
 * Public HTTP shape of a User.
 *
 * All fields are optional because user responses are CASL field-sanitized — a
 * caller only receives the fields it is permitted to read. Sensitive fields
 * (password, passwordChangeAt) and internal bookkeeping (deleteMarker, __v) are
 * intentionally omitted. ObjectIds are serialized to strings and dates to ISO.
 */
export interface UserResponseDto {
  _id?: string;
  id?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email?: string;
  profileImageId?: string | null;
  type?: ACCOUNT_TYPE_ENUMS | null;
  role?: USER_ROLE_ENUMS | null;
  emailVerificationStatus?: EMAIL_VERIFICATION_STATUS_ENUMS;
  kycStatus?: KYC_STATUS;
  tenantId?: string | null;
  jobProfileId?: string | null;
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
