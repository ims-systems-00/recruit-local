import { ONBOARDING_STEP_ENUMS } from '@rl/types';

export const getOnboardingValuesRoute = (step: ONBOARDING_STEP_ENUMS) => {
  return `/candidate/onboarding/values?step=${step}`;
};
