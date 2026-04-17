import React from 'react';
import Profile from './sections/profile';
import { getJobProfileById } from '@/services/job-profile/job-profile.server';
interface Props {
  params: {
    uid: string;
  };
}
export default async function ProfilePage({ params }: Props) {
  const { uid } = params;

  const response = await getJobProfileById(uid);

  if (!response.success) {
    return <div>Failed to load job profile</div>;
  }

  const jobProfileData = response.data;
  return <Profile jobProfileData={jobProfileData} />;
}
