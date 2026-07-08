'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  IndustryListBackendResponse,
  IndustryListFilters,
} from './industry.type';
import { ApiResponse } from '@/types/api';
import { IndustryListResponse } from './industry.type';
import qs from 'qs';

const API_ENDPOINT = '/industries';

export async function getIndustries(
  params?: IndustryListFilters,
): Promise<ApiResponse<IndustryListResponse>> {
  try {
    const res = await axiosServer.get<IndustryListBackendResponse>(
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
        industries: res.data.industries || [],
        pagination: res.data.pagination,
      },
      message: res.data.message,
    };
  } catch (error) {
    console.log('error', error);
    return handleServerError(error, 'Failed to fetch industries');
  }
}
