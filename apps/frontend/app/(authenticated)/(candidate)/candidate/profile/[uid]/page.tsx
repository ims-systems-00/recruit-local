import React from 'react';
import Profile from './sections/profile';
import { getJobProfileById } from '@/services/job-profile/job-profile.server';
type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function ProfilePage({ params }: PageProps) {
  const { uid } = await params;

  const response = await getJobProfileById(uid);

  if (!response.success) {
    return <div>Failed to load job profile</div>;
  }

  const jobProfileData = response.data;
  return <Profile jobProfileData={jobProfileData} />;
}
