'use client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { getUserById } from './user.server';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function useRefreshSession() {
  const { data: session, update } = useSession();

  const refreshSession = async () => {
    if (!session?.user?._id) return;

    const res = await getUserById(session.user._id);

    if (!res.success) return;

    await update({
      user: {
        ...session.user,
        ...res.data,
      },
    });
  };

  return { refreshSession };
}

export function useUserInfo() {
  const { data: session } = useSession();

  const router = useRouter();

  const query = useQuery({
    queryKey: ['user', session?.user?._id],
    enabled: !!session?.user?._id,

    queryFn: async () => {
      const res = await getUserById(session!.user?._id);

      if (!res.success) {
        router.push('/logout');

        throw new Error(res.message);
      }

      return res.data?.user;
    },
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}

export function useAuth() {
  const { data: session } = useSession();
  const router = useRouter();

  const query = useQuery({
    queryKey: ['auth'],
    enabled: !!session?.user?._id,

    queryFn: async () => {
      const res = await getUserById(session!.user?._id);

      if (!res.success) {
        router.push('/logout');
        throw new Error(res.message);
      }

      if (res.data?.user?.emailVerificationStatus !== 'verified') {
        router.push('/accounts/verify-email');
        return null;
      }

      if (res.data?.user?.type === 'employer' && !res.data?.user?.tenantId) {
        router.push('/onboarding/create-organization');
        return null;
      }
      return res.data?.user;
    },
  });

  return {
    user: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
  };
}
