'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  WorkModeListBackendResponse,
  WorkModeListFilters,
} from './work-mode.type';
import { ApiResponse } from '@/types/api';
import { WorkModeListResponse } from './work-mode.type';
import qs from 'qs';

const API_ENDPOINT = '/work-modes';

export async function getWorkModes(
  params?: WorkModeListFilters,
): Promise<ApiResponse<WorkModeListResponse>> {
  try {
    const res = await axiosServer.get<WorkModeListBackendResponse>(
      API_ENDPOINT,
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          search: params?.search,
        },
        paramsSerializer: (params) =>
          qs.stringify(params, { arrayFormat: 'brackets' }),
      },
    );
    // const backendResponse = await valueListResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: {
        workModes: res.data.workModes || [],
        pagination: res.data.pagination,
      },
      message: res.data.message,
    };
  } catch (error) {
    console.log('error', error);
    return handleServerError(error, 'Failed to fetch work modes');
  }
}
