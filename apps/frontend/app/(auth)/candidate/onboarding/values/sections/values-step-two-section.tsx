'use client';
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { useRouter } from 'next/navigation';
import { ValueData } from '@/services/value/value.type';
import ValuesSection from './values-section';

const STEP_TWO_TYPES = [VALUE_TYPE_ENUM.WORKING_STYLE];

export default function ValuesStepTwoSection({
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
      types={STEP_TWO_TYPES}
      onboardingStep={ONBOARDING_STEP_ENUMS.VALUES_STEP_2}
      progressValue={60}
      title="How you prefer to work, communicate, organise, and contribute within a team or environment?"
      onSuccessNext={() => {
        router.push(
          getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_3),
        );
      }}
      onSuccessBack={() => {
        router.push(
          getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_1),
        );
      }}
    />
  );
}
