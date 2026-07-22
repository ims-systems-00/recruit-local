'use client';
import { Button } from '@/components/ui/button';
import { JobProfileCreateInput } from '@/services/job-profile/job-profile.type';
import { createJobProfileSchema } from '@/services/job-profile/job-profile.validation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Resolver } from 'react-hook-form';
import { useCreateJobProfile } from '@/services/job-profile';

export default function InfoSection() {
  const { data: session } = useSession();
  const user = session?.user;

  const { handleSubmit } = useForm<JobProfileCreateInput>({
    resolver: yupResolver(
      createJobProfileSchema,
    ) as Resolver<JobProfileCreateInput>,
  });

  const { createJobProfile, isLoading } = useCreateJobProfile();

  const onSubmit = () => {
    let payload = {
      name: user?.firstName + ' ' + user?.lastName,
      email: user?.email,
    };
    createJobProfile(payload);
  };
  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
        <div className=" w-12 h-12 text-heading-sm text-fg-brand-secondary rounded-full border-[3px] border-fg-brand-secondary flex items-center justify-center">
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
          onClick={handleSubmit(onSubmit)}
          disabled={isLoading}
          className="bg-bg-brand-solid-primary text-white! text-label-md font-label-md-strong! cursor-pointer h-12 rounded-lg"
        >
          {isLoading ? 'Creating...' : 'Let’s Get Started'}
        </Button>
      </div>
    </div>
  );
}
