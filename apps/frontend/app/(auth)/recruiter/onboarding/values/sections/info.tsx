'use client';
import { Button } from '@/components/ui/button';
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import { HandHeart } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function InfoSection() {
  const router = useRouter();
  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
        <HandHeart className="size-16 text-text-brand-secondary" />
        <div className="space-y-spacing-lg text-center">
          <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
            Why We Ask About Values
          </p>
          <p className="text-label-lg text-text-gray-quaternary">
            Skills and experience show what a candidate can do — values help
            reveal how they work, what motivates them, and how they contribute
            within a team. Values-based matching helps employers improve
            retention, team compatibility, engagement, and long-term
            performance.
          </p>
        </div>
        <Button
          onClick={() =>
            router.push(
              `/recruiter/onboarding/values?step=${ONBOARDING_STEP_ENUMS.VALUES_STEP_1}`,
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
