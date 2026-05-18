'use server';

import { authOptions } from '@/app/api/auth/[...nextauth]/options';
import axios from 'axios';
import { getServerSession } from 'next-auth/next';
const baseURL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

export const axiosServer = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-type': 'application/json',
    Accept: 'application/json',
  },
});

// Add interceptor to attach server token
axiosServer.interceptors.request.use(async (config) => {
  const currentSession = await getServerSession(authOptions);

  if (currentSession?.accessToken) {
    config.headers['x-auth-access-token'] = currentSession.accessToken;
  }
  if (currentSession?.refreshToken) {
    config.headers['x-auth-refresh-token'] = currentSession.refreshToken;
  }

  return config;
});

// Optional error logging
axiosServer.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('Server Axios Error:', err?.response?.data || err.message);
    throw err;
  },
);
