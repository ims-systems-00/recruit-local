'use server';

import axios from 'axios';
import { getToken } from 'next-auth/jwt';
import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
// ponytail: server-side calls prefer INTERNAL_API_URL (runtime, in-container hostname).
// NEXT_PUBLIC_BASE_API_URL is baked at build for the browser and can't resolve inside the network.
const baseURL = `${process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_BASE_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

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
  // read tokens from the encrypted jwt cookie, the session no longer has them
  const token = await getToken({
    req: { cookies: await cookies(), headers: await headers() } as unknown as NextRequest,
  });

  if (token?.accessToken) {
    config.headers['x-auth-access-token'] = token.accessToken;
  }
  if (token?.refreshToken) {
    config.headers['x-auth-refresh-token'] = token.refreshToken;
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
