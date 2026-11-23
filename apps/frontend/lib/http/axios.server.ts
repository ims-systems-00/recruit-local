'use server';

import axios from 'axios';
import { getToken } from 'next-auth/jwt';
import { cookies, headers } from 'next/headers';
import type { NextRequest } from 'next/server';
import { serverApiBaseURL } from './server-api-base-url';
import {
  isSessionCookie,
  secureCookie,
  SESSION_COOKIE,
} from '@/lib/auth/session-cookie';

export const axiosServer = axios.create({
  baseURL: serverApiBaseURL,
  withCredentials: true,
  headers: {
    'Content-type': 'application/json',
    Accept: 'application/json',
  },
});

// Add interceptor to attach server token
axiosServer.interceptors.request.use(async (config) => {
  // tokens live only in the encrypted jwt cookie
  const token = await getToken({
    req: { cookies: await cookies(), headers: await headers() } as unknown as NextRequest,
    cookieName: SESSION_COOKIE,
    secureCookie,
  });

  if (token?.accessToken) {
    config.headers['x-auth-access-token'] = token.accessToken;
  }
  if (token?.refreshToken) {
    config.headers['x-auth-refresh-token'] = token.refreshToken;
  }

  return config;
});

// backend no longer accepts this session, drop ours so the next request goes to login
const clearSessionCookie = async () => {
  try {
    const store = await cookies();
    store
      .getAll()
      .filter(({ name }) => isSessionCookie(name))
      .forEach(({ name }) => store.delete(name));
  } catch {
    // server components can't write cookies, the next action or poll will
  }
};

// Optional error logging
axiosServer.interceptors.response.use(
  (res) => res,
  async (err) => {
    console.error('Server Axios Error:', err?.response?.data || err.message);
    if (err?.response?.status === 401) await clearSessionCookie();
    throw err;
  },
);
