'use server';
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

export async function getUserById(id: string): Promise<ApiResponse> {
  try {
    const res = await axiosServer.get(`/users/${id}`);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to fetch user');
  }
}
