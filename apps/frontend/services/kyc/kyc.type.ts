import { KYC_DOCUMENT_TYPE } from '@rl/types';
import { ApiResponse } from '@/types/api';

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
