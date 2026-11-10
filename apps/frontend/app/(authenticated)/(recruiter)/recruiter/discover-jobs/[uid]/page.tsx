import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getPublicJobById } from '@/services/jobs/jobs.server';
import { formatDate } from '@/lib/utils';
import JobDescription from './job-description/job-description';
import Link from 'next/link';
import JobActionsMenu from './job-description/job-actions-menu';

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function JobDetailsPage({ params }: PageProps) {
  const { uid } = await params;

  // The public read, so another organisation's open job opens here too. An
  // employer's `/jobs/:id` refuses any job outside their own organisation.
  const response = await getPublicJobById(uid);

  if (!response.success) {
    return <div>Failed to load job</div>;
  }

  const jobData = response.data;

  return (
    <div>
      <div className=" py-spacing-lg px-spacing-4xl border-b border-border-gray-secondary">
        <Breadcrumb className=" min-h-10 flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link
                href="/candidate/jobs"
                className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary"
              >
                Job Feed
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className=" text-fg-gray-tertiary " />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                {jobData?.title || 'N/A'}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className=" p-spacing-4xl space-y-spacing-4xl">
        <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-spacing-4xl">
          <div className=" space-y-spacing-2xs">
            <h3 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
              {jobData?.title}
            </h3>
            <p className=" capitalize text-label-sm text-text-gray-tertiary">
              Last Updated {formatDate(jobData?.updatedAt)}
            </p>
          </div>
          <div className=" flex items-center gap-spacing-lg">
            {/* <Link href={`/candidate/job/${uid}/apply`}>
              <Button className=" cursor-pointer bg-bg-brand-solid-primary h-9 text-text-white! rounded-lg text-label-sm font-label-sm-strong!">
                <Pointer />
                <span>Apply to this job</span>
              </Button>
            </Link> */}
            <JobActionsMenu job={jobData} />
          </div>
        </div>
        <div>
          <JobDescription job={jobData} />
        </div>
      </div>
    </div>
  );
}
