'use server';

import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  JobTitleListBackendResponse,
  JobTitleListFilters,
} from './job-title.type';
import { ApiResponse } from '@/types/api';
import { JobTitleListResponse } from './job-title.type';
import qs from 'qs';

const API_ENDPOINT = '/job-titles';

export async function getJobTitles(
  params?: JobTitleListFilters,
): Promise<ApiResponse<JobTitleListResponse>> {
  try {
    const res = await axiosServer.get<JobTitleListBackendResponse>(
      API_ENDPOINT,
      {
        params: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          clientSearch: params?.clientSearch,
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
        jobTitles: res.data.jobTitles || [],
        pagination: res.data.pagination,
      },
      message: res.data.message,
    };
  } catch (error) {
    console.log('error', error);
    return handleServerError(error, 'Failed to fetch job titles');
  }
}
