'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';

import { loginSchema, LoginSchema } from './login.schema';
import { loginApi } from '@/services/auth/auth.client';

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
    mutationFn: loginApi,
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
