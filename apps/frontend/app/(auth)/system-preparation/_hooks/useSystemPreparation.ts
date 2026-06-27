'use client';

import { useEffect, useMemo, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useUserInfo } from '@/services/user/user.client';
import { useJobProfile } from '@/services/job-profile/job-profile.client';

import { ACCOUNT_TYPE_ENUMS, ONBOARDING_STEP_ENUMS, User } from '@rl/types';
import { tenantKeys, useTenant } from '@/services/tenants/tenants.client';
import { JobProfile } from '@/services/job-profile/job-profile.type';
import { TenantData } from '@/services/tenants/tenants.type';

const NEXT_EMPLOYER_ONBOARDING_STEP: Record<string, string> = {
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_1]: ONBOARDING_STEP_ENUMS.VALUES_STEP_2,
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_2]: ONBOARDING_STEP_ENUMS.VALUES_STEP_3,
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_3]: ONBOARDING_STEP_ENUMS.VALUES_STEP_4,
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_4]: ONBOARDING_STEP_ENUMS.VALUES_STEP_5,
};

const NEXT_CANDIDATE_ONBOARDING_PERSONALISATION_STEP: Partial<
  Record<string, string>
> = {
  [ONBOARDING_STEP_ENUMS.NOT_STARTED]: ONBOARDING_STEP_ENUMS.CV_UPLOAD,
  [ONBOARDING_STEP_ENUMS.CV_UPLOAD]: ONBOARDING_STEP_ENUMS.JOB_TITLE,
  [ONBOARDING_STEP_ENUMS.JOB_TITLE]: ONBOARDING_STEP_ENUMS.INDUSTRY,
  [ONBOARDING_STEP_ENUMS.INDUSTRY]: ONBOARDING_STEP_ENUMS.EXPERIENCE_LEVEL,
  [ONBOARDING_STEP_ENUMS.EXPERIENCE_LEVEL]: ONBOARDING_STEP_ENUMS.WORK_MODE,
  [ONBOARDING_STEP_ENUMS.WORK_MODE]: ONBOARDING_STEP_ENUMS.LOCATION,
};

const NEXT_CANDIDATE_ONBOARDING_VALUES_STEP: Record<string, string> = {
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_1]: ONBOARDING_STEP_ENUMS.VALUES_STEP_2,
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_2]: ONBOARDING_STEP_ENUMS.VALUES_STEP_3,
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_3]: ONBOARDING_STEP_ENUMS.VALUES_STEP_4,
  [ONBOARDING_STEP_ENUMS.VALUES_STEP_4]: ONBOARDING_STEP_ENUMS.VALUES_STEP_5,
};

const getRedirectPath = ({
  user,
  tenant,
  jobProfile,
  redirect,
  isEmailVerified,
}: {
  user: User;
  tenant?: TenantData | null;
  jobProfile?: JobProfile | null;
  redirect?: string | null;
  isEmailVerified: boolean;
}) => {
  const isEmployer = user.type === ACCOUNT_TYPE_ENUMS.EMPLOYER;
  const isCandidate = user.type === ACCOUNT_TYPE_ENUMS.CANDIDATE;

  if (!isEmailVerified) {
    return '/accounts/verify-email';
  }

  // Employer
  if (isEmployer) {
    if (!tenant?._id) {
      return '/recruiter/onboarding/create-organization';
    }

    if (!tenant.onboardingStep) {
      return '/recruiter/onboarding/values';
    }

    if (tenant.onboardingStep !== ONBOARDING_STEP_ENUMS.VALUES_STEP_5) {
      return `/recruiter/onboarding/values?step=${
        NEXT_EMPLOYER_ONBOARDING_STEP[tenant.onboardingStep]
      }`;
    }

    if (redirect) {
      return redirect;
    }

    return `/recruiter/profile/${tenant._id}`;
  }

  // Candidate
  if (isCandidate) {
    if (!jobProfile?._id) {
      return '/candidate/onboarding/personalisation';
    }

    const personalisationStep =
      NEXT_CANDIDATE_ONBOARDING_PERSONALISATION_STEP[
        jobProfile.onboardingStep ?? ''
      ];

    if (personalisationStep) {
      return `/candidate/onboarding/personalisation?step=${personalisationStep}`;
    }

    if (jobProfile.onboardingStep === ONBOARDING_STEP_ENUMS.LOCATION) {
      return '/candidate/onboarding/values';
    }

    if (jobProfile.onboardingStep !== ONBOARDING_STEP_ENUMS.VALUES_STEP_5) {
      return `/candidate/onboarding/values?step=${
        NEXT_CANDIDATE_ONBOARDING_VALUES_STEP[jobProfile.onboardingStep ?? '']
      }`;
    }

    if (redirect) {
      return redirect;
    }

    return `/candidate/profile/${jobProfile._id}`;
  }

  if (user.type === ACCOUNT_TYPE_ENUMS.PLATFORM_ADMIN) {
    return '/recruiter';
  }

  return null;
};

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

    const path = getRedirectPath({
      user,
      tenant,
      jobProfile,
      redirect: searchParams.get('redirect'),
      isEmailVerified,
    });

    if (!path) return;

    startTransition(() => {
      router.push(path);
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
