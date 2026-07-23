import axios from 'axios';
import { getSession } from 'next-auth/react';

const baseURL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-type': 'application/json',
    Accept: 'application/json',
  },
});

axiosClient.interceptors.request.use(async (config) => {
  const currentSession = await getSession();

  if (currentSession?.accessToken) {
    config.headers['x-auth-access-token'] = currentSession.accessToken;
  }
  if (currentSession?.refreshToken) {
    config.headers['x-auth-refresh-token'] = currentSession.refreshToken;
  }

  return config;
});

// Optional logging or auth
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('Client Axios Error:', err?.response?.data || err.message);
    throw err;
  },
);
