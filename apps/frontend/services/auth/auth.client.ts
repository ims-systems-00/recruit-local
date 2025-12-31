'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { signIn } from 'next-auth/react';
import { loginSchema, LoginSchema } from '@/app/(auth)/login/login.schema';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import {
  SignupFormValues,
  signupSchema,
} from '@/app/(auth)/sign-up/signup.schema';
import { registerUser } from './auth.server';

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
      toast.success('Logged in successfully');
      router.push('/recruiter');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Invalid email or password');
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
      toast.success('Logged out successfully');
      router.push('/login');
    },
    onError: () => {
      toast.error('Failed to logout. Please try again.');
    },
  });

  return {
    logout: mutation.mutate,
    isLoading: mutation.isPending,
  };
}

export function useSignup() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: yupResolver(signupSchema),
  });

  const mutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (res) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.data.message);
      form.reset();
      router.push('/registration-verification/resend');
    },
    onError: () => {
      toast.error('Something went wrong. Please try again.');
    },
  });

  return {
    // react-hook-form
    ...form,
    onSubmit: form.handleSubmit((data) => mutation.mutate(data)),

    // password toggle
    showPassword,
    togglePassword: () => setShowPassword((p) => !p),

    // react-query state
    isSubmitting: mutation.isPending,
    isError: mutation.isError,
  };
}
