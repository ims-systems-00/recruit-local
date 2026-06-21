'use client';
import { Button } from '@/components/ui/button';
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import { useRouter } from 'next/navigation';

export default function CandidateOnboardingPage() {
  const router = useRouter();
  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
        <div className=" w-12 h-12 text-heading-sm text-fg-brand-secondary rounded-full border border-fg-brand-secondary flex items-center justify-center">
          1
        </div>
        <div className="space-y-spacing-lg text-center">
          <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
            Build Your Professional Profile
          </p>
          <p className="text-label-lg text-text-gray-quaternary">
            Answer a few questions to discover your values and find where you
            fit best.
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(
              `/candidate/onboarding/personalisation?step=${ONBOARDING_STEP_ENUMS.CV_UPLOAD}`,
            )
          }
          className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-12 rounded-lg"
        >
          Let’s Get Started
        </Button>
      </div>
    </div>
  );
}
