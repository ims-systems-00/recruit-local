'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';
import { loginSchema, LoginSchema } from '@/app/(auth)/login/login.schema';
import { signOut } from 'next-auth/react';

export function useLogin() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: yupResolver(loginSchema),
  });

  const mutation = useMutation({
    mutationFn: async (payload: LoginSchema) => {
      const res = await signIn('credentials', {
        email: payload.email,
        password: payload.password,
        redirect: false,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      return res;
    },
    onSuccess: () => {
      router.push('/recruiter');
    },
  });

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data);
  });

  const togglePassword = () => setShowPassword((prev) => !prev);

  return {
    register,
    onSubmit,
    errors,
    isLoading: mutation.isPending,
    showPassword,
    togglePassword,
  };
}

export function useLogout() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await signOut({
        redirect: false,
        callbackUrl: '/login',
      });

      return res;
    },
    onSuccess: () => {
      router.push('/login');
    },
  });

  return {
    logout: mutation.mutate,
    isLoading: mutation.isPending,
  };
}
