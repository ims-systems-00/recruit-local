'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  ExperienceLevelListBackendResponse,
  ExperienceLevelListFilters,
} from './experience-level.type';
import { ApiResponse } from '@/types/api';
import { ExperienceLevelListResponse } from './experience-level.type';
import qs from 'qs';

const API_ENDPOINT = '/experience-levels';

export async function getExperienceLevels(
  params?: ExperienceLevelListFilters,
): Promise<ApiResponse<ExperienceLevelListResponse>> {
  try {
    const res = await axiosServer.get<ExperienceLevelListBackendResponse>(
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
        experienceLevels: res.data.experienceLevels || [],
        pagination: res.data.pagination,
      },
      message: res.data.message,
    };
  } catch (error) {
    console.log('error', error);
    return handleServerError(error, 'Failed to fetch experience levels');
  }
}
