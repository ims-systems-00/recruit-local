'use client';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { EllipsisVertical, MapPin } from 'lucide-react';
import { JobData } from '@/services/jobs/job.type';
import { cn, formatDate } from '@/lib/utils';
import { formatJobStatus, getJobStatusBadgeClass } from './jobs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { JOBS_STATUS_ENUMS } from '@rl/types';
import { useUpdateJob } from '@/services/jobs/jobs.client';
import JobAction from './job-action';
import ApplicantAvatarStack from './applicant-avatar-stack';

export default function CardJobItem({ job }: { job: JobData }) {
  const [jobIsOpen, setJobIsOpen] = useState(
    job.status === JOBS_STATUS_ENUMS.OPEN ? true : false,
  );
  const { updateJob, isPending } = useUpdateJob();
  const onUpdateJob = async () => {
    setJobIsOpen(true);
    await updateJob({
      id: job._id,
      data: {
        status: JOBS_STATUS_ENUMS.OPEN,
      },
      onSuccessNext: (newData) => {
        setJobIsOpen(true);
      },
      onError: () => {
        setJobIsOpen(false);
      },
    });
  };
  return (
    <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs">
      <div className=" p-spacing-4xl space-y-spacing-4xl">
        <div className=" space-y-spacing-sm">
          <div className="flex justify-between items-center gap-spacing-4xl">
            <p className=" text-label-sm text-text-gray-tertiary">
              {job?.reference || 'N/A'}
            </p>
            <JobAction job={job} />
          </div>

          <Badge
            className={cn(
              ' text-label-sm font-label-sm-strong!',
              getJobStatusBadgeClass(job.status || ''),
            )}
          >
            {formatJobStatus(job.status || '')}
          </Badge>

          <div className=" space-y-spacing-2xs">
            <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              {job?.title || 'N/A'}
            </h4>
            <div className=" flex flex-col sm:flex-row items-start sm:items-center gap-spacing-xs">
              <div className="flex items-center gap-spacing-2xs text-text-gray-tertiary">
                <MapPin className=" text-fg-gray-tertiary size-4" />
                <p className="text-body-sm line-clamp-1">
                  {job?.location || 'N/A'}
                </p>
              </div>
              <div className="flex items-center gap-spacing-2xs text-text-gray-tertiary">
                <div className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
                <p className="text-body-sm whitespace-nowrap ">
                  {job?.employmentType || 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className=" flex justify-between items-center">
          <div className=" flex items-center gap-spacing-sm ">
            <p className="text-label-sm font-body-sm-strong!  text-text-gray-primary">
              Applied
            </p>
            <p className=" text-body-sm text-text-gray-tertiary">
              {job?.totalApplications || 0}
            </p>
          </div>
          <ApplicantAvatarStack
            applicants={job?.applicantPreview}
            total={job?.totalApplications}
          />
        </div>
      </div>
      <div className=" border-t border-border-gray-secondary flex justify-between items-center gap-2.5 px-spacing-4xl py-spacing-2xl">
        <p className=" text-body-sm text-text-gray-tertiary">
          {formatDate(job?.updatedAt) || 'N/A'}
        </p>
        <div className=" flex items-center gap-spacing-sm ">
          <Switch
            checked={jobIsOpen}
            onCheckedChange={onUpdateJob}
            disabled={jobIsOpen}
            onClick={(e) => e.stopPropagation()}
            className=" bg-bg-gray-soft-quaternary data-[state=checked]:bg-bg-brand-solid-primary"
          />
          <p className=" text-body-sm text-text-gray-tertiary">Active</p>
        </div>
      </div>
    </div>
  );
}
