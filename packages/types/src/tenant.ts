import { TENANT_STATUS_ENUMS, TENANT_TYPE } from './tenant.enum';
import { ONBOARDING_STEP_ENUMS } from './onboarding';
import { Completion } from './completion';
import { ValueResponseDto } from './value';

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
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
}
