'use server';
import { axiosServer } from '@/lib/http/axios.server';

export async function loginUser(data: any) {
  const res = await axiosServer.post('/auth/login', data);

  return res.data;
}
