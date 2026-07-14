import { ONBOARDING_STEP_ENUMS, TENANT_TYPE } from '@rl/types';
import { ValueData } from '../value';

export type AwsStorageType = {
  Name: string;
  Bucket: string;
  Key: string;
};

export interface StoredCompletion {
  percentage: number;
  completeSections: string[];
  computedAt?: Date | string | null;
}

export type TenantData = {
  _id: string;
  name: string;
  description?: string;
  industry?: string;
  type?: string;
  size?: number;
  phone?: string;
  email?: string;

  logoSquareSrc?: string;
  logoSquareStorage?: AwsStorageType;

  logoRectangleSrc?: string;
  logoRectangleStorage?: AwsStorageType;

  coverPhoto: {
    _id: string;
    src: string;
    visibility: string;
    storageInformation: AwsStorageType;
    thumbnail: AwsStorageType;
  };
  profileImage: {
    _id: string;
    src: string;
    visibility: string;
    storageInformation: AwsStorageType;
  };

  officeAddress?: string;
  addressInMap?: string;

  status: string;

  website?: string;
  linkedIn?: string;

  missionStatement?: string;
  visionStatement?: string;
  coreProducts?: string;
  coreServices?: string;
  values?: ValueData[];
  onboardingStep?: ONBOARDING_STEP_ENUMS;
  completion?: StoredCompletion;
  isRecruitmentEnabled?: boolean;
  deleteMarker?: {
    status: boolean;
    deletedAt?: string | null;
    dateScheduled?: string | null;
  };
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
};

export type TenantsItemBackendResponse = {
  success: boolean;
  tenant: TenantData;
  message?: string;
};
