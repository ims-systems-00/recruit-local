import { TENANT_TYPE } from '@rl/types';

export type AwsStorageType = {
  Name: string;
  Bucket: string;
  Key: string;
};

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

  officeAddress?: string;
  addressInMap?: string;

  status: string;

  website?: string;
  linkedIn?: string;

  missionStatement?: string;
  visionStatement?: string;
  coreProducts?: string;
  coreServices?: string;
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
