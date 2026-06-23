'use client';
import InfoSection from './sections/info';
import { useSearchParams } from 'next/navigation';
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import ValuesStepOneSection from './sections/values-step-one-section';
import ValuesStepTwoSection from './sections/values-step-two-section';
import ValuesStepThreeSection from './sections/values-step-three-section';
import ValuesStepFourSection from './sections/values-step-four-section';
import ValuesStepFiveSection from './sections/values-step-five-section';
import { useSession } from 'next-auth/react';
import { useTenant } from '@/services/tenants/tenants.client';
import Image from 'next/image';
import LoaderSvg from '@/public/images/loader.svg';

export default function ValuesPage() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step');

  const { data: session } = useSession();
  const user = session?.user;

  const { tenant, isLoading: isTenantLoading } = useTenant(user?.tenantId);

  if (isTenantLoading || !tenant) {
    return (
      <div className=" flex justify-center items-center bg-card">
        <div className="rounded-md p-12 flex items-center flex-col gap-spacing-4xl">
          <div className="min-w-[145px] animate-spin animation-duration-[2s]">
            <Image
              className="max-h-[145px] max-w-[145px]"
              alt="Logo"
              src={LoaderSvg}
              width={145}
              height={145}
            />
          </div>
          <div className="flex items-center justify-center gap-spacing-4xl flex-col">
            <div className="flex flex-col items-center justify-center gap-spacing-lg min-w-[350px] max-w-[444px]">
              <h3>Hang Tight</h3>
              <p className="text-center leading-6">
                The system is preparing your Profile please wait for while
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_1) {
    return (
      <ValuesStepOneSection
        existingValues={tenant?.values ?? []}
        tenantId={user?.tenantId ?? ''}
        tenantName={tenant?.name ?? ''}
      />
    );
  }
  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_2) {
    return (
      <ValuesStepTwoSection
        existingValues={tenant?.values ?? []}
        tenantId={user?.tenantId ?? ''}
        tenantName={tenant?.name ?? ''}
      />
    );
  }
  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_3) {
    return (
      <ValuesStepThreeSection
        existingValues={tenant?.values ?? []}
        tenantId={user?.tenantId ?? ''}
        tenantName={tenant?.name ?? ''}
      />
    );
  }
  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_4) {
    return (
      <ValuesStepFourSection
        existingValues={tenant?.values ?? []}
        tenantId={user?.tenantId ?? ''}
        tenantName={tenant?.name ?? ''}
      />
    );
  }
  if (step === ONBOARDING_STEP_ENUMS.VALUES_STEP_5) {
    return (
      <ValuesStepFiveSection
        existingValues={tenant?.values ?? []}
        tenantId={user?.tenantId ?? ''}
        tenantName={tenant?.name ?? ''}
      />
    );
  }
  return <InfoSection />;
}
