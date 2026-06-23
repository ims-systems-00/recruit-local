'use client';
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { useRouter } from 'next/navigation';
import { ValueData } from '@/services/value/value.type';
import ValuesSection from './values-section';

const STEP_ONE_TYPES = [
  VALUE_TYPE_ENUM.GROWTH,
  VALUE_TYPE_ENUM.LEARNING,
  VALUE_TYPE_ENUM.CHALLENGE,
  VALUE_TYPE_ENUM.INNOVATION,
];

export default function ValuesStepOneSection({
  existingValues,
  tenantId,
  tenantName,
}: {
  existingValues: ValueData[];
  tenantId: string;
  tenantName: string;
}) {
  const router = useRouter();

  return (
    <ValuesSection
      existingValues={existingValues}
      tenantId={tenantId}
      tenantName={tenantName}
      types={STEP_ONE_TYPES}
      onboardingStep={ONBOARDING_STEP_ENUMS.VALUES_STEP_1}
      progressValue={40}
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
