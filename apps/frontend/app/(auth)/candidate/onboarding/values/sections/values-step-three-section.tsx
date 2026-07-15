'use client';
import { useRouter } from 'next/navigation';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import ValuesSection from './values-section';
import { ValueData } from '@/services/value/value.type';

const STEP_THREE_TYPES = [VALUE_TYPE_ENUM.CULTURE_AND_BEHAVIOR];

export default function ValuesStepThreeSection({
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
      types={STEP_THREE_TYPES}
      onboardingStep={ONBOARDING_STEP_ENUMS.VALUES_STEP_3}
      progressValue={70}
      title="The interpersonal, ethical, and social values that matter most to you in a workplace?"
      onSuccessNext={() => {
        router.push(
          getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_4),
        );
      }}
      onSuccessBack={() => {
        router.push(
          getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_2),
        );
      }}
    />
  );
}
