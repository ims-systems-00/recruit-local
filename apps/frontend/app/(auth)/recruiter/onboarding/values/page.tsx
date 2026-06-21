'use client';
import InfoSection from './sections/info';
import { useSearchParams } from 'next/navigation';
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import ValuesStepOneSection from './sections/values-step-one-section';
import ValuesStepTwoSection from './sections/values-step-two-section';
import ValuesStepThreeSection from './sections/values-step-three-section';
import ValuesStepFourSection from './sections/values-step-four-section';
import ValuesStepFiveSection from './sections/values-step-five-section';

export default function ValuesPage() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step');

  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_1) {
    return <ValuesStepOneSection />;
  }
  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_2) {
    return <ValuesStepTwoSection />;
  }
  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_3) {
    return <ValuesStepThreeSection />;
  }
  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_4) {
    return <ValuesStepFourSection />;
  }
  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_5) {
    return <ValuesStepFiveSection />;
  }
  return <InfoSection />;
}
