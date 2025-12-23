'use server';

import axios from 'axios';
const baseURL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

export const axiosServer = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-type': 'application/json',
    Accept: 'application/json',
  },
});

// Optional error logging
axiosServer.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('Server Axios Error:', err?.response?.data || err.message);
    throw err;
  },
);
