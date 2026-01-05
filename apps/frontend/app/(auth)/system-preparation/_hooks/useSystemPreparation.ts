'use client';
import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUserInfo } from '@/services/user/user.client';

export const useSystemPreparation = () => {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUserInfo();
  const [isPending, startTransition] = useTransition();

  const isEmailVerified = user?.emailVerificationStatus === 'verified';

  const userType = user?.type;

  useEffect(() => {
    if (!isUserLoading && user) {
      startTransition(() => {
        if (!isEmailVerified) {
          router.push('/accounts/verify-email');
          return;
        }
        if (userType === 'employer' && !user.tenantId) {
          router.push('/onboarding/create-organization');
          return;
        }
        if (userType === 'candidate') {
          router.push('/recruiter');
          return;
        }
        if (userType === 'platform-admin') {
          router.push('/recruiter');
          return;
        }
      });
    }
  }, [isUserLoading, user, isEmailVerified, router]);

  return { isEmailVerified, isUserLoading, isPending };
};
