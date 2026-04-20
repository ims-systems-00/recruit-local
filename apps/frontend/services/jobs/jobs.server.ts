'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import {
  JobData,
  JobListBackendResponse,
  JobListFilters,
  JobListResponse,
} from './job.type';
import { jobIdParamsSchema, JobItemBackendResponse } from './job.validation';
import { MultiStepJobFormValues } from '@/app/(authenticated)/(recruiter)/recruiter/job/[uid]/edit/job.schema';
import qs from 'qs';

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
        status: params?.status,
        employmentType: params?.employmentType,
        workplace: params?.workplace,
        salaryMode: params?.salaryMode,
        period: params?.period,
      },
      paramsSerializer: (params) =>
        qs.stringify(params, { arrayFormat: 'repeat' }),
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
      message: res.data.message || 'Successful',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch posts');
  }
}

export async function getJobById(id: string): Promise<ApiResponse<JobData>> {
  try {
    await jobIdParamsSchema.validate({ id });

    const res = await axiosServer.get<JobItemBackendResponse>(
      `${API_ENDPOINT}/${id}`,
    );

    // const backendResponse = await postItemResponseSchema.validate(res.data, {
    //   stripUnknown: true,
    // });

    return {
      success: true,
      data: res.data.job,
      message: res.data.message || 'Successful',
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch post');
  }
}

export async function updateJob({
  id,
  data,
}: {
  id: string;
  data: Partial<MultiStepJobFormValues>;
}): Promise<ApiResponse> {
  try {
    const res = await axiosServer.put(`${API_ENDPOINT}/${id}`, data);

    return {
      success: true,
      data: res.data.job,
      message: res.data.message,
    };
  } catch (error) {
    return handleServerError(error, 'Failed');
  }
}
