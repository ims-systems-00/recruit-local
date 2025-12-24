'use client';

import { signIn } from 'next-auth/react';

export interface LoginPayload {
  email: string;
  password: string;
}

export async function loginApi(payload: LoginPayload) {
  const res = await signIn('credentials', {
    email: payload.email,
    password: payload.password,
    redirect: false,
  });

  if (res?.error) {
    throw new Error(res.error);
  }

  return res;
}
