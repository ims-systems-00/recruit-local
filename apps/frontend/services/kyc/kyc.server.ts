'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  Kyc,
  KycApiResponse,
  KycCreateInput,
  KycListFilters,
  KycListResponse,
  KycListBackendResponse,
} from './kyc.type';
import { kycCreateValidationSchema } from './kyc.validation';
import { ApiResponse } from '@/types/api';
import qs from 'qs';

const API_ENDPOINT = '/kycs';

export async function getKycList(
  params?: KycListFilters,
): Promise<ApiResponse<KycListResponse>> {
  try {
    const res = await axiosServer.get<KycListBackendResponse>(API_ENDPOINT, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        clientSearch: params?.clientSearch,
      },
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: 'brackets' }),
    });
    // const backendResponse = await valueListResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: {
        kyc: res.data.kycs || [],
        pagination: res.data.pagination,
      },
      message: res.data.message,
    };
  } catch (error) {
    console.log('error', error);
    return handleServerError(error, 'Failed to fetch kyc list');
  }
}

export async function createKyc(
  payload: KycCreateInput,
): Promise<KycApiResponse<Kyc>> {
  try {
    const validatedPayload = await kycCreateValidationSchema.validate(payload, {
      abortEarly: false,
    });

    const res = await axiosServer.post(API_ENDPOINT, validatedPayload);

    // const validatedResponse = await jobProfileItemResponseSchema.validate(
    //   res.data,
    //   {
    //     stripUnknown: true,
    //   },
    // );

    return {
      success: true,
      data: res.data.kyc,
      message: res.data.message || 'Kyc created successfully',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to create kyc');
  }
}
