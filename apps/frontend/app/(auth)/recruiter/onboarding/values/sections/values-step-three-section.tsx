'use client';
import { useRouter } from 'next/navigation';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import ValuesSection from './values-section';
import { ValueData } from '@/services/value/value.type';

const STEP_THREE_TYPES = [
  VALUE_TYPE_ENUM.INTERPERSONAL,
  VALUE_TYPE_ENUM.ETHICAL,
  VALUE_TYPE_ENUM.SOCIAL,
];

export default function ValuesStepThreeSection({
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
      types={STEP_THREE_TYPES}
      onboardingStep={ONBOARDING_STEP_ENUMS.VALUES_STEP_3}
      progressValue={60}
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
