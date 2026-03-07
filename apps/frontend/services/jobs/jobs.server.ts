'use server';
import { MultiStepJobFormValues } from '@/app/(authenticated)/(recruiter)/recruiter/job/create/job.schema';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';

type SuccessResponse<T = any> = {
  success: true;
  data: T;
};

type ErrorResponse = {
  success: false;
  message: string;
};

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export async function createJob(
  data: MultiStepJobFormValues,
): Promise<ApiResponse> {
  try {
    const res = await axiosServer.post('/jobs', data);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Failed');
  }
}
