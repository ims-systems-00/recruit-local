'use client';
import { TenantData } from '@/services/tenants/tenants.type';
import { Building, Mailbox, PhoneCall, ShieldCheck, Users } from 'lucide-react';
import React from 'react';
import ProfileInfoCard from './profile-info-card';
import MapByAddress from '@/components/map-by-address';
import { TENANT_INDUSTRY_ENUMS } from '@rl/types';
import { JobProfile } from '@/services/job-profile/job-profile.type';
export const TENANT_INDUSTRY_LABEL_MAP: Record<TENANT_INDUSTRY_ENUMS, string> =
  {
    [TENANT_INDUSTRY_ENUMS.TECHNOLOGY]: 'Technology',
    [TENANT_INDUSTRY_ENUMS.FINANCE]: 'Finance',
    [TENANT_INDUSTRY_ENUMS.HEALTHCARE]: 'Healthcare',
    [TENANT_INDUSTRY_ENUMS.EDUCATION]: 'Education',
    [TENANT_INDUSTRY_ENUMS.MANUFACTURING]: 'Manufacturing',
    [TENANT_INDUSTRY_ENUMS.RETAIL]: 'Retail',
    [TENANT_INDUSTRY_ENUMS.HOSPITALITY]: 'Hospitality',
    [TENANT_INDUSTRY_ENUMS.CONSTRUCTION]: 'Construction',
    [TENANT_INDUSTRY_ENUMS.TRANSPORTATION]: 'Transportation',
    [TENANT_INDUSTRY_ENUMS.ENERGY]: 'Energy',
  };
export default function About({ profile }: { profile: JobProfile }) {
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" space-y-spacing-2xl">
        <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
          About
        </p>
        <p className=" text-body-lg text-text-gray-tertiary">
          {profile?.summary || 'N/A'}
        </p>
      </div>

      <div className=" space-y-spacing-2xl">
        <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
          Contact and Address
        </p>
        <div className=" grid grid-cols-3 gap-spacing-2xl">
          <ProfileInfoCard
            title="Contact Email"
            subtitle={profile.email}
            icon={<Mailbox />}
          />
          <ProfileInfoCard
            title="Contact Number"
            subtitle={profile.contactNumber}
            icon={<PhoneCall />}
          />
          <ProfileInfoCard
            title="Address"
            subtitle={profile.address}
            icon={<Building />}
          />
        </div>
      </div>
      <div className=" grid grid-cols-2 gap-spacing-2xl">
        <div className=" space-y-spacing-2xl">
          <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Skills
          </p>
          <p className=" text-body-lg text-text-gray-tertiary">
            {profile?.skills || 'N/A'}
          </p>
        </div>
        <div className=" space-y-spacing-2xl">
          <p className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Interests
          </p>
          <p className=" text-body-lg text-text-gray-tertiary">
            {profile?.interests || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
}
