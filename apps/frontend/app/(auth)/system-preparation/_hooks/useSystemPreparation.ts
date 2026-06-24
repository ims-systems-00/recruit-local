'use client';

import { useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useUserInfo } from '@/services/user/user.client';
import { useJobProfile } from '@/services/job-profile/job-profile.client';

import { ACCOUNT_TYPE_ENUMS, ONBOARDING_STEP_ENUMS } from '@rl/types';
import { tenantKeys, useTenant } from '@/services/tenants/tenants.client';

export const useSystemPreparation = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const { user, isLoading: isUserLoading } = useUserInfo();

  const isEmployer = user?.type === ACCOUNT_TYPE_ENUMS.EMPLOYER;
  const isCandidate = user?.type === ACCOUNT_TYPE_ENUMS.CANDIDATE;

  const { tenant, isLoading: isTenantLoading } = useTenant(
    user?.tenantId,
    !!user?._id && isEmployer,
  );

  const { jobProfile, isLoading: isJobProfileLoading } = useJobProfile(
    user?.jobProfileId ?? '',
    !!user?._id && isCandidate,
  );

  const [isPending, startTransition] = useTransition();

  const isEmailVerified = user?.emailVerificationStatus === 'verified';

  const isDataReady = useMemo(() => {
    if (isUserLoading) return false;

    if (isEmployer) {
      return !isTenantLoading;
    }

    if (isCandidate) {
      return !isJobProfileLoading;
    }

    return true;
  }, [
    isUserLoading,
    isTenantLoading,
    isJobProfileLoading,
    isEmployer,
    isCandidate,
  ]);

  useEffect(() => {
    if (!user?._id || !isDataReady) return;

    startTransition(() => {
      const redirect = searchParams.get('redirect');

      if (!isEmailVerified) {
        router.push('/accounts/verify-email');
        return;
      }

      if (isEmployer && !tenant?._id) {
        router.push('/recruiter/onboarding/create-organization');
        return;
      }

      if (isCandidate && !jobProfile?._id) {
        router.push('/candidate/onboarding/personalisation');
        return;
      }

      if (redirect) {
        router.push(redirect);
        return;
      }

      if (isEmployer && tenant?._id && !tenant?.onboardingStep) {
        router.push(`/recruiter/onboarding/values`);
        return;
      }

      if (
        isEmployer &&
        tenant?._id &&
        tenant?.onboardingStep === ONBOARDING_STEP_ENUMS.VALUES_STEP_5
      ) {
        router.push(`/recruiter/profile/${tenant?._id}`);
        return;
      }

      if (isEmployer && tenant?._id && tenant?.onboardingStep) {
        router.push(
          `/recruiter/onboarding/values?step=${tenant?.onboardingStep}`,
        );
        return;
      }

      if (isCandidate && jobProfile?._id) {
        router.push(`/candidate/profile/${jobProfile?._id}`);
        return;
      }

      if (user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
        router.push('/recruiter');
      }
    });
  }, [
    user,
    tenant,
    jobProfile,
    isDataReady,
    isEmailVerified,
    router,
    searchParams,
  ]);

  return {
    isPending,
    isUserLoading,
    isEmailVerified,
    isLoading: !isDataReady,
  };
};
