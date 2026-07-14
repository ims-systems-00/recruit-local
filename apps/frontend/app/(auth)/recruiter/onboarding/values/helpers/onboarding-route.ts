import { ONBOARDING_STEP_ENUMS } from '@rl/types';

export const getOnboardingValuesRoute = (step: ONBOARDING_STEP_ENUMS) => {
  return `/recruiter/onboarding/values?step=${step}`;
};
