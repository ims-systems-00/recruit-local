'use client';
import { useRouter } from 'next/navigation';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import ValuesSection from './values-section';
import { ValueData } from '@/services/value/value.type';

const STEP_FOUR_TYPES = [VALUE_TYPE_ENUM.LEADERSHIP];
export default function ValuesStepFourSection({
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
      types={STEP_FOUR_TYPES}
      onboardingStep={ONBOARDING_STEP_ENUMS.VALUES_STEP_4}
      progressValue={80}
      title="How you prefer teams to operate and how leadership supports performance, development, and collaboration?"
      onSuccessNext={() => {
        router.push(
          getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_5),
        );
      }}
      onSuccessBack={() => {
        router.push(
          getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_3),
        );
      }}
    />
  );
}
