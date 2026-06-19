'use client';
import React from 'react';
import { Button } from '@/components/ui/button';

import { InputGroup, InputGroupInput } from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { useCreateJobProfile } from '@/services/job-profile';
import { Resolver, useForm } from 'react-hook-form';
import { JobProfileCreateInput } from '@/services/job-profile/job-profile.type';
import { createJobProfileSchema } from '@/services/job-profile/job-profile.validation';
import { yupResolver } from '@hookform/resolvers/yup';
import { useLogout } from '@/services/auth/auth.client';
import { useAuth } from '@/services/user/user.client';

export default function CreateJobProfileForm() {
  const { user } = useAuth();
  const { logout, isLoading: isLoggingOut } = useLogout();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<JobProfileCreateInput>({
    resolver: yupResolver(
      createJobProfileSchema,
    ) as Resolver<JobProfileCreateInput>,
  });

  const { createJobProfile, isLoading } = useCreateJobProfile();

  const onSubmit = (data: JobProfileCreateInput) => {
    let payload = {
      ...data,
      name: user?.firstName + ' ' + user?.lastName,
      email: user?.email,
    };
    createJobProfile(payload);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className=" space-y-spacing-4xl">
      <div className="space-y-spacing-xs">
        <Label className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
          Job Profile Title
        </Label>
        <div className=" space-y-spacing-3xs">
          <InputGroup className="h-10 rounded-lg shadow-light">
            <InputGroupInput
              type="text"
              placeholder="Enter job profile title"
              {...register('headline')}
            />
          </InputGroup>
          {errors.headline && (
            <p className="text-sm text-red-500">{errors.headline.message}</p>
          )}
        </div>
      </div>
      <div className=" flex justify-end items-center gap-4 pt-3 border-t border-border">
        <Button
          type="button"
          onClick={() => logout()}
          disabled={isLoggingOut || isLoading}
          className=" cursor-pointer text-base bg-transparent border border-border text-title rounded-lg h-10 hover:bg-transparent"
        >
          {isLoggingOut ? 'Logging out...' : 'Cancel'}
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isLoggingOut}
          className=" cursor-pointer text-base bg-bg-brand-solid-primary border-primary text-white rounded-lg h-10"
        >
          {isLoading ? 'Creating...' : 'Continue'}
        </Button>
      </div>
    </form>
  );
}
