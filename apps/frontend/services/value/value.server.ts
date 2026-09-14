'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  ValueData,
  ValueListBackendResponse,
  ValueListFilters,
} from './value.type';
import { ApiResponse } from '@/types/api';
import { ValueListResponse } from './value.type';
import { valueListResponseSchema } from './value.validation';
import qs from 'qs';
import { VALUE_TYPE_ENUM } from '@rl/types';

const API_ENDPOINT = '/values';

export async function getValues(
  params?: ValueListFilters,
): Promise<ApiResponse<ValueListResponse>> {
  try {
    const typeParam =
      typeof params?.type === 'string'
        ? params.type
        : params?.type &&
            typeof params.type === 'object' &&
            'in' in params.type &&
            Array.isArray(params.type.in)
          ? params.type.in[0]
          : undefined;

    const res = await axiosServer.get<ValueListBackendResponse>(API_ENDPOINT, {
      params: {
        cursor: params?.cursor,
        limit: params?.limit || 10,
        clientSearch: params?.clientSearch,
        type: typeParam,
      },
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: 'brackets' }),
    });
    // const backendResponse = await valueListResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    console.log('res', res);

    return {
      success: true,
      data: {
        values: res.data.values || [],
        pagination: res.data.pagination,
      },
      message: res.data.message,
    };
  } catch (error) {
    console.log('error', error);
    return handleServerError(error, 'Failed to fetch values');
  }
}

export async function getTopThreeValues(
  type: VALUE_TYPE_ENUM,
): Promise<ApiResponse<ValueData[]>> {
  try {
    const res = await axiosServer.get<ValueListBackendResponse>(
      API_ENDPOINT + '/top-three',
      {
        params: {
          type,
        },
      },
    );

    return {
      success: true,
      data: res.data.values || [],
      message: res.data.message,
    };
  } catch (error) {
    console.log('error', error);
    return handleServerError(error, 'Failed to fetch values');
  }
}
