import Link from 'next/link';
import React from 'react';
import CreateOrganizationForm from './create-organization-form';

export default function CreateOrganization() {
  return (
    <div className=" min-h-screen flex justify-center items-center bg-card">
      <div className=" shadow-regular w-[692px] bg-card rounded-lg flex flex-col gap-y-spacing-5xl p-12">
        <div className="space-y-spacing-lg">
          <h4>Create Your Organization</h4>
          <p>
            Enter your organization name to begin. Setup can be completed later
          </p>
        </div>
        <CreateOrganizationForm />
        <div className="flex justify-end">
          <p className="text-base text-body">
            In trouble?{' '}
            <Link href={'/sign-up'} className="text-primary">
              Help is available
            </Link>{' '}
          </p>
        </div>
      </div>
    </div>
  );
}
