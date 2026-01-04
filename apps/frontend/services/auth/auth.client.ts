'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useMutation } from '@tanstack/react-query';
import { signIn, useSession } from 'next-auth/react';
import { loginSchema, LoginSchema } from '@/app/(auth)/login/login.schema';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';
import {
  SignupFormValues,
  signupSchema,
} from '@/app/(auth)/sign-up/signup.schema';
import {
  registerUser,
  registrationVerificationToken,
  resendVerificationLink,
} from './auth.server';

const AUTH_ERROR_MAP: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password',
  INVALID_CREDENTIALS: 'Invalid email or password',
  INVALID_INPUT: 'Please enter email and password',
};

async function loginWithCredentials(email: string, password: string) {
  const res = await signIn('credentials', {
    email,
    password,
    redirect: false,
  });

  if (!res) {
    throw new Error('Something went wrong. Please try again.');
  }

  if (res.error) {
    throw new Error(
      AUTH_ERROR_MAP[res.error] ?? 'Login failed. Please try again.',
    );
  }

  return res;
}

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
    mutationFn: (payload: LoginSchema) =>
      loginWithCredentials(payload.email, payload.password),

    onSuccess: () => {
      toast.success('Logged in successfully');
      router.push('/system-preparation');
    },
    onError: (error: Error) => {
      console.log('error', error);

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

    onSuccess: async (res, variables) => {
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      try {
        await loginWithCredentials(variables.email, variables.password);

        toast.success(res.data.message);
        form.reset();
        router.push('/registration-verification/resend');
      } catch {
        toast.success('Account created successfully');
        router.push('/login');
      }
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

export function useResendVerificationLink() {
  const { data: session } = useSession();

  const mutation = useMutation({
    mutationFn: async () => {
      const res = await resendVerificationLink(session?.user.email || '');
      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.data.message);
    },
    onError: (err) => {
      toast.error('Something went wrong. Please try again.');
    },
  });

  return {
    resend: mutation.mutate,
    isLoading: mutation.isPending,
  };
}

export function useRegistrationVerificationToken() {
  const mutation = useMutation({
    mutationFn: async (token: string) => {
      if (!token) {
        throw new Error('Verification token is missing');
      }

      const res = await registrationVerificationToken(token);

      if (!res.success) {
        throw new Error(res.message);
      }

      return res.data;
    },
    onSuccess: (data) => {
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Something went wrong. Please try again.');
    },
  });

  return {
    verify: mutation.mutate,
    isLoading: mutation.isPending,
  };
}
