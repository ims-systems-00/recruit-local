import { TenantData } from '@/services/tenants/tenants.type';
import React from 'react';

export default function ServicesAndProducts({
  profile,
}: {
  profile: TenantData;
}) {
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" space-y-spacing-4xl">
        <div className=" space-y-spacing-2xl">
          <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Mission Statement
          </p>
          <p className=" text-body-lg text-text-gray-tertiary">
            {profile?.missionStatement || 'N/A'}
          </p>
        </div>
        <div className=" space-y-spacing-2xl">
          <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Vision Statement
          </p>
          <p className=" text-body-lg text-text-gray-tertiary">
            {profile?.visionStatement || 'N/A'}
          </p>
        </div>
        <div className=" grid grid-cols-2 gap-spacing-2xl">
          <div className=" space-y-spacing-2xl">
            <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
              Core Products
            </p>
            <p className=" text-body-lg text-text-gray-tertiary">
              {profile?.coreProducts || 'N/A'}
            </p>
          </div>
          <div className=" space-y-spacing-2xl">
            <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
              Core Services
            </p>
            <p className=" text-body-lg text-text-gray-tertiary">
              {profile?.coreServices || 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
