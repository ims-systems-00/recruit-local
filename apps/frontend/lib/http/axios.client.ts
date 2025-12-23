import axios from 'axios';

const baseURL = `${process.env.NEXT_PUBLIC_BASE_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;

export const axiosClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-type': 'application/json',
    Accept: 'application/json',
  },
});

// Optional logging or auth
axiosClient.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('Client Axios Error:', err?.response?.data || err.message);
    throw err;
  },
);
