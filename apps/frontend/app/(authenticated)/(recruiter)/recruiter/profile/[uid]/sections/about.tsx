'use client';
import { TenantData } from '@/services/tenants/tenants.type';
import { Building, Mailbox, PhoneCall, ShieldCheck, Users } from 'lucide-react';
import React from 'react';
import ProfileInfoCard from './profile-info-card';
import MapByAddress from '@/components/map-by-address';
import { INDUSTRY_ENUMS } from '@rl/types';
export const TENANT_INDUSTRY_LABEL_MAP: Record<INDUSTRY_ENUMS, string> = {
  [INDUSTRY_ENUMS.TECHNOLOGY]: 'Technology',
  [INDUSTRY_ENUMS.FINANCE]: 'Finance',
  [INDUSTRY_ENUMS.HEALTHCARE]: 'Healthcare',
  [INDUSTRY_ENUMS.EDUCATION]: 'Education',
  [INDUSTRY_ENUMS.MANUFACTURING]: 'Manufacturing',
  [INDUSTRY_ENUMS.RETAIL]: 'Retail',
  [INDUSTRY_ENUMS.HOSPITALITY]: 'Hospitality',
  [INDUSTRY_ENUMS.CONSTRUCTION]: 'Construction',
  [INDUSTRY_ENUMS.TRANSPORTATION]: 'Transportation',
  [INDUSTRY_ENUMS.ENERGY]: 'Energy',
};
export default function About({ profile }: { profile: TenantData }) {
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center">
        <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
          About
        </h4>
      </div>
      <div className=" space-y-spacing-2xl">
        <div className=" space-y-spacing-lg">
          <p className=" text-body-lg text-text-gray-tertiary">
            {profile?.description || 'N/A'}
          </p>
          <div className=" grid grid-cols-3 gap-spacing-lg">
            <ProfileInfoCard
              title="Industry"
              subtitle={
                profile?.industry
                  ? TENANT_INDUSTRY_LABEL_MAP[
                      profile.industry as INDUSTRY_ENUMS
                    ]
                  : 'N/A'
              }
              icon={<ShieldCheck />}
            />
            <ProfileInfoCard
              title="Organisation type"
              subtitle={profile.type}
              icon={<Building />}
            />
            <ProfileInfoCard
              title="Employers"
              subtitle={profile.size}
              icon={<Users />}
            />
          </div>
        </div>
        <div className=" space-y-spacing-lg">
          <p className=" text-label-lg font-label-lg-strong! text-text-gray-secondary">
            Contact and Address
          </p>
          <div className=" grid grid-cols-2 gap-spacing-lg">
            <ProfileInfoCard
              title="Contact Email"
              subtitle={profile.email}
              icon={<Mailbox />}
            />

            <ProfileInfoCard
              title="Contact Number"
              subtitle={profile.phone}
              icon={<PhoneCall />}
            />
          </div>
        </div>
        <div className=" space-y-spacing-lg">
          <div className=" rounded-2xl border border-border-gray-secondary p-spacing-4xl flex flex-col gap-spacing-2xl">
            <div className="flex gap-spacing-lg items-center">
              <div className=" w-12 h-12 rounded-md flex items-center justify-center border border-others-gray-light bg-others-gray-gray-zero shadow-xs ">
                <Building />
              </div>
              <div className=" space-y-spacing-3xs">
                <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                  Office Address
                </p>
                <p className=" text-label-sm text-text-gray-tertiary">
                  {profile.officeAddress}
                </p>
              </div>
            </div>
            <div>
              {profile?.officeAddress && (
                <MapByAddress address={profile?.officeAddress} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
