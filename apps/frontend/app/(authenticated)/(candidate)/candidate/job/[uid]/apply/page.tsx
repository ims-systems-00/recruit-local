import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getJobById } from '@/services/jobs/jobs.server';
import Link from 'next/link';
import React from 'react';
import ApplicationsForm from './sections/applications/applications-form';

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function ApplyPage({ params }: PageProps) {
  const { uid } = await params;

  const response = await getJobById(uid);

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
                className="text-label-sm font-label-sm-strong! text-text-gray-quaternary"
              >
                Job Feed
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className=" text-fg-gray-tertiary " />
            <BreadcrumbItem>
              <Link
                href={`/candidate/job/${uid}`}
                className="text-label-sm font-label-sm-strong! text-text-gray-quaternary"
              >
                {jobData?.title || 'N/A'}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className=" text-fg-gray-tertiary " />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                Apply
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className=" p-spacing-4xl">
        <ApplicationsForm job={jobData} />
      </div>
    </div>
  );
}
