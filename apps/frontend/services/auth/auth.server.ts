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

export async function registrationVerificationToken(
  registration_token: string,
): Promise<ApiResponse> {
  try {
    const res = await axiosServer.post(
      '/auth/registration/verification',
      {},
      {
        params: { registration_token },
      },
    );

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to resend verification email');
  }
}

export async function forgotPassword(email: string): Promise<ApiResponse> {
  try {
    const res = await axiosServer.post('/auth/recovery', { email });

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to send recovery link');
  }
}

export async function changePassword(
  password: string,
  recovery_token: string,
): Promise<ApiResponse> {
  try {
    const res = await axiosServer.post(
      '/auth/recovery/verification',
      { password },
      {
        params: { recovery_token },
      },
    );

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    return handleServerError(error, 'Failed to change password');
  }
}
