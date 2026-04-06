'use server';
import { MultiStepJobFormValues } from '@/app/(authenticated)/(recruiter)/recruiter/job/create/job.schema';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  JobListBackendResponse,
  JobListFilters,
  JobListResponse,
} from './job.type';

type SuccessResponse<T = any> = {
  success: true;
  message: string;
  data: T;
};

type ErrorResponse = {
  success: false;
  message: string;
};

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

const API_ENDPOINT = '/jobs';

export async function createJob(data: { title: string }): Promise<ApiResponse> {
  try {
    const res = await axiosServer.post(API_ENDPOINT, data);

    return {
      success: true,
      data: res.data.job,
      message: res.data.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed');
  }
}

export async function getJobs(
  params?: JobListFilters,
): Promise<ApiResponse<JobListResponse>> {
  try {
    const res = await axiosServer.get<JobListBackendResponse>(API_ENDPOINT, {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        search: params?.search,
      },
    });
    // const backendResponse = await postListResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: {
        docs: res.data.jobs || [],
        pagination: res.data.pagination,
      },
      message: res.data.message || '',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch posts');
  }
}
