import { TENANT_STATUS_ENUMS, TENANT_TYPE } from './tenant.enum';
import { ONBOARDING_STEP_ENUMS } from './onboarding';
import { Completion } from './completion';
import { ValueResponseDto } from './value';
import { FileMediaRefDto } from './file-media';
import { KYC_STATUS } from './kyc';

/** AWS storage descriptor attached to a tenant logo. */
export interface TenantStorageDto {
  Name?: string;
  Bucket?: string;
  Key?: string;
}

/**
 * Public HTTP shape of a Tenant (organisation).
 *
 * All fields are optional because tenant responses are CASL field-sanitized
 * — a caller only receives the fields it is permitted to read. Internal fields
 * (deleteMarker, deletedAt, __v) are intentionally omitted. ObjectIds are
 * serialized to strings and dates to ISO.
 */
export interface TenantResponseDto {
  _id?: string;
  id?: string;
  name?: string;
  description?: string;
  industry?: string;
  type?: TENANT_TYPE;
  size?: number;
  phone?: string;
  email?: string;
  logoSquareSrc?: string;
  logoSquareStorage?: TenantStorageDto | null;
  logoRectangleSrc?: string;
  logoRectangleStorage?: TenantStorageDto | null;
  profileImage?: FileMediaRefDto | null; // populated (present only when looked up)
  coverPhoto?: FileMediaRefDto | null; // populated (present only when looked up)
  officeAddress?: string;
  addressInMap?: string;
  addressInMapLat?: number;
  addressInMapLng?: number;
  status?: TENANT_STATUS_ENUMS;
  website?: string;
  linkedIn?: string;
  missionStatement?: string;
  visionStatement?: string;
  coreProducts?: string;
  coreServices?: string;
  values?: ValueResponseDto[]; // populated value documents
  onboardingStep?: ONBOARDING_STEP_ENUMS;
  isRecruitmentEnabled?: boolean;
  completion?: Completion; // expanded breakdown (percentage + sections + missing)
  kycStatus?: KYC_STATUS | null; // primary admin's KYC status; null if the org has no admin yet
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}

/**
 * Compact, public shape of the tenant (organisation) that owns another document
 * — embedded on that document's reads so a client can render the author without
 * a second request.
 *
 * Deliberately narrower than TenantResponseDto: identity and branding only.
 * Contact details (email, phone) and internal state (status, completion,
 * onboarding, keywords, values) stay behind the tenant endpoint, which applies
 * its own CASL rules. Kept in sync with TENANT_SUMMARY_FIELDS in the backend's
 * common/query.
 */
export interface TenantSummaryDto {
  _id?: string;
  name?: string;
  description?: string;
  industry?: string;
  // No `type` (TENANT_TYPE): it is low-value inline and the name is reserved for
  // the discriminator when a summary is merged into a union like PostCreatorDto.
  // Read the tenant endpoint for it.
  size?: number;
  website?: string;
  linkedIn?: string;
  officeAddress?: string;
  logoSquareSrc?: string;
  logoRectangleSrc?: string;
  profileImage?: FileMediaRefDto | null; // populated FileMedia (`src` is the public URL)
}
