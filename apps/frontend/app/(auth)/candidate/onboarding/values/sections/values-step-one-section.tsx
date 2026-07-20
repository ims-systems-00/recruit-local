'use client';
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { useRouter } from 'next/navigation';
import { ValueData } from '@/services/value/value.type';
import ValuesSection from './values-section';

const STEP_ONE_TYPES = [VALUE_TYPE_ENUM.MINDSET];

export default function ValuesStepOneSection({
  existingValues,
  jobProfileId,
}: {
  existingValues: ValueData[];
  jobProfileId: string;
}) {
  const router = useRouter();

  return (
    <ValuesSection
      existingValues={existingValues}
      jobProfileId={jobProfileId}
      types={STEP_ONE_TYPES}
      onboardingStep={ONBOARDING_STEP_ENUMS.VALUES_STEP_1}
      progressValue={50}
      title="How you approach growth, learning, challenges, and innovation?"
      onSuccessNext={() => {
        router.push(
          getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_2),
        );
      }}
      isBackDisabled={true}
    />
  );
}
