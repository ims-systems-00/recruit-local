import { KYC_DOCUMENT_TYPE } from '@rl/types';
import { ApiResponse, Pagination } from '@/types/api';

export type AwsStorageType = {
  Name: string;
  Bucket: string;
  Key: string;
};

export type Kyc = {
  _id: string;
  documentType: KYC_DOCUMENT_TYPE;
  nationalInsuranceNumber?: string;
  documentFrontStorage?: AwsStorageType;
  documentBackStorage?: AwsStorageType;
};

export type KycApiResponse<T> = ApiResponse<T>;

export interface KycCreateInput {
  documentType: KYC_DOCUMENT_TYPE;
  nationalInsuranceNumber?: string;
  documentFrontStorage?: AwsStorageType;
  documentBackStorage?: AwsStorageType;
}

export type KycListFilters = {
  page?: number;
  limit?: number;
  clientSearch?: string;
};

export type KycListResponse = {
  kyc: KycData[];
  pagination: Pagination;
};

export type KycData = {
  _id: string;
  userId: string;
  status: string;
  firstName: string;
  lastName: string;
  documentType: KYC_DOCUMENT_TYPE;
  documentFront?: {
    _id: string;
    src: string;
    visibility: string;
    storageInformation: AwsStorageType;
  };
  documentBack?: {
    _id: string;
    src: string;
    visibility: string;
    storageInformation: AwsStorageType;
  };
  documentFrontId?: string;
  documentBackId?: string;
  nationalInsuranceNumber?: string;
  createdAt: string;
  updatedAt: string;
};

export type KycListBackendResponse = {
  success: boolean;
  kycs: KycData[];
  pagination: Pagination;
  message?: string;
};
