import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getJobById } from '@/services/jobs/jobs.server';
import EditForm from './edit-form';

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function EditJob({ params }: PageProps) {
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
              <BreadcrumbLink
                href="/recruiter/jobs"
                className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary"
              >
                Job Listing
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className=" text-fg-gray-tertiary " />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                Create a job post
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className=" px-spacing-4xl">
        <EditForm defaultValues={jobData} />
      </div>
    </div>
  );
}
