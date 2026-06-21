'use client';
import Link from 'next/link';
import React from 'react';
import CreateOrganizationForm from './create-organization-form';
import { Progress } from '@/components/ui/progress';

export default function CreateOrganization() {
  return (
    <div className=" flex justify-center items-center">
      <div className=" w-[692px] bg-bg-gray-soft-primary rounded-lg flex flex-col items-center justify-center gap-y-spacing-4xl p-spacing-5xl">
        <div className="w-full flex items-center justify-between gap-spacing-lg">
          <Progress value={10} className="w-full h-2.5" />
          <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
            10%
          </span>
        </div>
        <div className="w-full space-y-spacing-2xs">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
            Create Your Organization
          </h4>
          <p className=" text-label-sm text-text-gray-quaternary">
            Enter your organization name to begin. Setup can be completed later
          </p>
        </div>
        <CreateOrganizationForm />
        <div className="w-full flex justify-end">
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
