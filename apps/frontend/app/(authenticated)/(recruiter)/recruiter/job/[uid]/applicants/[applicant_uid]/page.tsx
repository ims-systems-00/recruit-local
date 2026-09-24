import React from 'react';
import { getJobById } from '@/services/jobs/jobs.server';
import { getApplicationById } from '@/services/application/application.server';
import ApplicantDetailsView from './applicant-details-view';

type PageProps = {
  params: Promise<{ uid: string; applicant_uid: string }>;
};

export default async function ApplicantDetailsPage({ params }: PageProps) {
  const { uid, applicant_uid } = await params;

  let jobData = null;
  let applicationData = null;

  if (uid) {
    const jobRes = await getJobById(uid);
    if (jobRes.success) {
      jobData = jobRes.data;
    }
  }

  if (applicant_uid) {
    const appRes = await getApplicationById(applicant_uid);
    if (appRes.success) {
      applicationData = appRes.data;
    }
  }

  return (
    <ApplicantDetailsView
      jobId={uid}
      applicantId={applicant_uid}
      jobData={jobData}
      applicationData={applicationData}
    />
  );
}
