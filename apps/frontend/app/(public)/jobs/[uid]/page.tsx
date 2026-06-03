import { getPublicJobById } from '@/services/jobs/jobs.server';
import React from 'react';
import Banner from '../sections/banner';
import JobDescription from './sections/job-description/job-description';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Pointer, Share2 } from 'lucide-react';
import BookmarkButton from './sections/job-description/bookmark-button';

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function JobDetailsPage({ params }: PageProps) {
  const { uid } = await params;

  const response = await getPublicJobById(uid);

  if (!response.success) {
    return <div>Failed to load job</div>;
  }

  const jobData = response.data;
  return (
    <div>
      <Banner />

      <div className=" max-w-[1280px] mx-auto px-spacing-5xl py-spacing-7xl  flex flex-col gap-y-spacing-7xl">
        <div className=" flex justify-between items-center gap-spacing-4xl">
          <div className=" space-y-spacing-2xs">
            <h3 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
              {jobData?.title}
            </h3>
            <p className=" capitalize text-label-sm text-text-gray-tertiary">
              Last Updated {formatDate(jobData?.updatedAt)}
            </p>
          </div>
          <div className=" flex items-center gap-spacing-lg">
            <Link href={`/candidate/job/${uid}/apply`}>
              <Button className=" cursor-pointer bg-bg-brand-solid-primary h-9 text-text-white! rounded-lg text-label-sm font-label-sm-strong!">
                <Pointer />
                <span>Apply to this job</span>
              </Button>
            </Link>
            <BookmarkButton job_id={uid} />
            <Button className="cursor-pointer w-9! p-spacing-0! bg-bg-gray-soft-primary hover:bg-bg-gray-soft-primary hover:border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!">
              <Share2 />
            </Button>
          </div>
        </div>
        <div>
          <JobDescription job={jobData} />
        </div>
      </div>
    </div>
  );
}
