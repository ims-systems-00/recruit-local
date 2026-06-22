import Link from 'next/link';
import React from 'react';
import CreateJobProfileForm from './create-job-profile-form';

export default function CreateJobProfile() {
  return (
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className=" w-[400px] bg-card rounded-lg flex flex-col gap-y-spacing-4xl px-spacing-sm sm:px-spacing-0">
        <div className="space-y-spacing-xs">
          <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
            Create Your Job Profile
          </h4>
          <p className=" text-body-md text-text-gray-tertiary">
            Enter your job profile title to begin. Setup can be completed later
          </p>
        </div>
        <CreateJobProfileForm />
        <div className="flex justify-end">
          <p className="text-base text-body">
            In trouble?{' '}
            <Link href={'/sign-up'} className="text-text-brand-primary">
              Help is available
            </Link>{' '}
          </p>
        </div>
      </div>
    </div>
  );
}
