'use client';
import React, { useState } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';
import Link from 'next/link';
import { JobData } from '@/services/jobs/job.type';
import { JOBS_STATUS_ENUMS } from '@rl/types';
import { useUpdateJob } from '@/services/jobs/jobs.client';
export default function JobAction({ job }: { job: JobData }) {
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="text-fg-gray-secondary flex items-center justify-center cursor-pointer">
          <EllipsisVertical size={16} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32 bg-white">
        <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
          <Link href={`/recruiter/job/${job?._id}`} className=" w-full">
            View Details
          </Link>
        </DropdownMenuItem>
        {!jobIsOpen && (
          <>
            <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              <Link
                href={`/recruiter/job/${job?._id}/edit`}
                className=" w-full"
              >
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onUpdateJob}
              className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Closed
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
