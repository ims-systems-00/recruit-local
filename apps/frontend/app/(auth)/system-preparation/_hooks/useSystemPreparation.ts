'use client';
import { useEffect, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUserInfo } from '@/services/user/user.client';
import { ACCOUNT_TYPE_ENUMS } from '@rl/types';

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
        if (userType === ACCOUNT_TYPE_ENUMS.EMPLOYER && !user.tenantId) {
          router.push('/onboarding/create-organization');
          return;
        }
        if (userType === ACCOUNT_TYPE_ENUMS.EMPLOYER) {
          router.push('/recruiter/profile');
          return;
        }
        if (userType === ACCOUNT_TYPE_ENUMS.CANDIDATE) {
          router.push('/recruiter/profile');
          return;
        }
        if (userType === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
          router.push('/recruiter');
          return;
        }
      });
    }
  }, [isUserLoading, user, isEmailVerified, router]);

  return { isEmailVerified, isUserLoading, isPending };
};
