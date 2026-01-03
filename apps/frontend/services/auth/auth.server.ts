'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { handleServerError } from '@/lib/http/handleServerError';
import { AxiosError } from 'axios';

type SuccessResponse<T = any> = {
  success: true;
  data: T;
};

type ErrorResponse = {
  success: false;
  message: string;
};

export type ApiResponse<T = any> = SuccessResponse<T> | ErrorResponse;

export async function loginUser(data: any): Promise<ApiResponse> {
  try {
    const res = await axiosServer.post('/auth/login', data);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Login failed');
  }
}

export async function registerUser(data: any): Promise<ApiResponse> {
  try {
    const { confirmPassword, agreed, ...payload } = data;
    const res = await axiosServer.post('/auth/registration', payload);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Registration failed');
  }
}

export async function resendVerificationLink(
  email: string,
): Promise<ApiResponse> {
  try {
    const res = await axiosServer.post(
      '/auth/registration/verification/email',
      { email },
    );

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to resend verification email');
  }
}
