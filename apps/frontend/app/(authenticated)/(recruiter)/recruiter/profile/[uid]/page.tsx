import React from 'react';
import Profile from '../sections/profile';
import { getTenantById } from '@/services/tenants/tenants.server';
interface Props {
  params: {
    uid: string;
  };
}
export default async function ProfilePage({ params }: Props) {
  const { uid } = params;

  const response = await getTenantById(uid);

  if (!response.success) {
    return <div>Failed to load tenant</div>;
  }

  const tenantData = response.data;
  return <Profile tenantData={tenantData} />;
}
