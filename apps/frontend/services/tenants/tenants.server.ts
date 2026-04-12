'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import { TenantData, TenantsItemBackendResponse } from './tenants.type';
import {
  tenantsIdParamsSchema,
  tenantsItemResponseSchema,
} from './tenants.validation';

type SuccessResponse<T = any> = {
  success: true;
  data: T;
  message?: string;
};

type ErrorResponse = {
  success: false;
  message: string;
};

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

const API_ENDPOINT = '/tenants';

export async function createTanent(data: any): Promise<ApiResponse> {
  try {
    const res = await axiosServer.post('/tenants', data);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Failed');
  }
}

export async function getTenantById(
  id: string,
): Promise<ApiResponse<TenantData>> {
  try {
    await tenantsIdParamsSchema.validate({ id });

    const res = await axiosServer.get<TenantsItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
    );

    console.log('res', res);

    const backendResponse = await tenantsItemResponseSchema.validate(res.data, {
      stripUnknown: true,
    });

    return {
      success: true,
      data: backendResponse.tenant,
      message: backendResponse.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch post');
  }
}
