'use server';
import { axiosServer } from '@/lib/http/axios.server';
import { AxiosError } from 'axios';

type RegisterResponse =
  | { success: true; data: any }
  | { success: false; message: string };

export async function loginUser(data: any) {
  const res = await axiosServer.post('/auth/login', data);

  return res.data;
}

export async function registerUser(data: any): Promise<RegisterResponse> {
  try {
    const { confirmPassword, agreed, ...payload } = data;
    const res = await axiosServer.post('/auth/registration', payload);

    return {
      success: true,
      data: res.data,
    };
  } catch (error) {
    if (error instanceof AxiosError) {
      return {
        success: false,
        message:
          error.response?.data?.message ??
          'Registration failed. Please try again.',
      };
    }

    return {
      success: false,
      message: 'Something went wrong',
    };
  }
}
