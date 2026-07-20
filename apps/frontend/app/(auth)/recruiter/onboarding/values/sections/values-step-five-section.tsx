'use client';

import { useRouter } from 'next/navigation';
import { getOnboardingValuesRoute } from '../helpers/onboarding-route';
import { ONBOARDING_STEP_ENUMS, VALUE_TYPE_ENUM } from '@rl/types';
import ValuesSection from './values-section';
import { ValueData } from '@/services/value/value.type';

const STEP_FIVE_TYPES = [VALUE_TYPE_ENUM.MOTIVATION];

export default function ValuesStepFiveSection({
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
      types={STEP_FIVE_TYPES}
      onboardingStep={ONBOARDING_STEP_ENUMS.VALUES_STEP_5}
      progressValue={100}
      title="What motivates you professionally and what gives your work meaning and fulfilment?"
      onSuccessNext={() => {
        setTimeout(() => {
          router.push(`/system-preparation`);
        }, 1000);
      }}
      onSuccessBack={() => {
        router.push(
          getOnboardingValuesRoute(ONBOARDING_STEP_ENUMS.VALUES_STEP_4),
        );
      }}
    />
  );
}
