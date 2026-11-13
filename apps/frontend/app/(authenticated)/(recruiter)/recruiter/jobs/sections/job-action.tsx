'use client';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';
import Link from 'next/link';
import { JobData } from '@/services/jobs/job.type';
import { getJobStatusActions } from './job-status';
import { useJobStatusChange } from './use-job-status-change';

const itemClassName =
  'text-label-sm font-label-sm-strong! text-text-gray-secondary';

export default function JobAction({ job }: { job: JobData }) {
  const { canEdit, canClose, canPublish } = getJobStatusActions(job);
  const { requestChange, dialog } = useJobStatusChange(job);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Job actions"
            className="text-fg-gray-secondary flex items-center justify-center cursor-pointer"
          >
            <EllipsisVertical size={16} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32 bg-white">
          <DropdownMenuItem className={itemClassName}>
            <Link href={`/recruiter/job/${job._id}`} className="w-full">
              View Details
            </Link>
          </DropdownMenuItem>
          {canEdit && (
            <DropdownMenuItem className={itemClassName}>
              <Link href={`/recruiter/job/${job._id}/edit`} className="w-full">
                Edit
              </Link>
            </DropdownMenuItem>
          )}
          {canClose && (
            <DropdownMenuItem
              className={itemClassName}
              onSelect={() => requestChange('close')}
            >
              Close
            </DropdownMenuItem>
          )}
          {canPublish && (
            <DropdownMenuItem
              className={itemClassName}
              onSelect={() => requestChange('publish')}
            >
              Publish
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {dialog}
    </>
  );
}
