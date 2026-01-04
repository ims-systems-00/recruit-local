'use client';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { getUserById } from './user.server';
import { useQuery } from '@tanstack/react-query';

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

  const query = useQuery({
    queryKey: ['user', session?.user?._id],
    enabled: !!session?.user?._id,

    queryFn: async () => {
      console.log('session?.user?._id', session?.user?._id);

      const res = await getUserById(session!.user?._id);

      if (!res.success) {
        throw new Error(res.message);
      }
      console.log('res.data', res.data);

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
