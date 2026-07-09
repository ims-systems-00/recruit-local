'use client';
import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ONBOARDING_STEP_ENUMS } from '@rl/types';
import CvUploadSection from './sections/cv-upload/cv-upload';
import InfoSection from './sections/info';
import { useSession } from 'next-auth/react';
import { useJobProfile } from '@/services/job-profile/job-profile.client';
import Image from 'next/image';
import LoaderSvg from '@/public/images/loader.svg';
import JobTitleSection from './sections/job-title';
import IndustrySection from './sections/industry';
import ExperienceLevelSection from './sections/experience-level';
import WorkModeSection from './sections/work-mode';
import LocationSection from './sections/location';

function PersonalisationPageContent() {
  const searchParams = useSearchParams();
  const step = searchParams.get('step');

  const { data: session } = useSession();
  const jobProfileId = session?.user?.jobProfileId;

  console.log('session', session);

  const { jobProfile, isLoading: isJobProfileLoading } = useJobProfile(
    jobProfileId || '',
  );

  console.log('jobProfile', jobProfile);

  if (isJobProfileLoading || !session?.user?._id) {
    return (
      <div className=" flex justify-center items-center bg-card">
        <div className="rounded-md p-12 flex items-center flex-col gap-spacing-4xl">
          <div className="min-w-[145px] animate-spin animation-duration-[2s]">
            <Image
              className="max-h-[145px] max-w-[145px]"
              alt="Logo"
              src={LoaderSvg}
              width={145}
              height={145}
            />
          </div>
          <div className="flex items-center justify-center gap-spacing-4xl flex-col">
            <div className="flex flex-col items-center justify-center gap-spacing-lg min-w-[350px] max-w-[444px]">
              <h3>Hang Tight</h3>
              <p className="text-center leading-6">
                The system is preparing your Profile please wait for while
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (step === ONBOARDING_STEP_ENUMS.CV_UPLOAD) {
    return <CvUploadSection jobProfileId={jobProfile?._id || ''} />;
  }
  if (step === ONBOARDING_STEP_ENUMS.JOB_TITLE) {
    return (
      <JobTitleSection
        jobProfileId={jobProfile?._id || ''}
        existingJobTitles={
          jobProfile?.jobTitle?.map((jobTitle) => jobTitle._id) || []
        }
      />
    );
  }
  if (step === ONBOARDING_STEP_ENUMS.INDUSTRY) {
    return (
      <IndustrySection
        jobProfileId={jobProfile?._id || ''}
        existingIndustries={
          jobProfile?.industry?.map((industry) => industry._id) || []
        }
      />
    );
  }
  if (step === ONBOARDING_STEP_ENUMS.EXPERIENCE_LEVEL) {
    return (
      <ExperienceLevelSection
        jobProfileId={jobProfile?._id || ''}
        existingExperienceLevels={jobProfile?.experienceLevel || ''}
      />
    );
  }
  if (step === ONBOARDING_STEP_ENUMS.WORK_MODE) {
    return (
      <WorkModeSection
        jobProfileId={jobProfile?._id || ''}
        existingWorkModes={
          jobProfile?.workMode?.map((workMode) => workMode._id) || []
        }
      />
    );
  }

  if (step === ONBOARDING_STEP_ENUMS.LOCATION) {
    return (
      <LocationSection
        jobProfileId={jobProfile?._id || ''}
        existingLocation={jobProfile?.address || ''}
      />
    );
  }
  return <InfoSection />;
}

export default function PersonalisationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center bg-card">
          <p>Loading...</p>
        </div>
      }
    >
      <PersonalisationPageContent />
    </Suspense>
  );
}
