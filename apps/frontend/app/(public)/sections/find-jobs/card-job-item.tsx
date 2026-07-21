'use client';
import React from 'react';
import { Bookmark, Building2, Loader2, Pointer } from 'lucide-react';
import { JobData } from '@/services/jobs/job.type';
import { cn, formatDate } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ACCOUNT_TYPE_ENUMS } from '@rl/types';

export default function CardJobItem({ job }: { job: Partial<JobData> }) {
  const { data: session } = useSession();
  const isEmployer = session?.user?.type === ACCOUNT_TYPE_ENUMS.EMPLOYER;

  return (
    <div className="p-spacing-4xl  border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs flex justify-between sm:flex-row flex-col gap-spacing-4xl">
      <div className=" space-y-spacing-4xl">
        <div className=" flex items-center gap-spacing-sm">
          <div className=" min-w-12 max-w-12 ">
            <div className="max-h-12 max-w-12 w-12 h-12 bg-others-gray-gray-zero rounded-full flex items-center justify-center border border-others-gray-xlight">
              <Building2 className="text-others-gray-default size-7" />
            </div>
            {/* <Image
              className="max-h-12 max-w-12 w-12 h-12 rounded-full "
              alt="Logo"
              src={DefaultImgForJob}
              width={48}
              height={48}
            /> */}
          </div>
          <div className=" space-y-spacing-2xs">
            <Link href={`/jobs/${job?._id}`}>
              <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                {job?.title || 'N/A'}
              </h4>
            </Link>
            <div className=" flex items-center gap-spacing-2xs">
              <p className="text-label-sm capitalize text-text-gray-quaternary">
                {job?.employmentType || 'N/A'}
              </p>
              <div className=" inline-block w-px h-[13px] rounded-full bg-fg-gray-tertiary"></div>
              <p className="text-label-sm text-text-gray-quaternary">
                {formatDate(job?.updatedAt) || 'N/A'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-spacing-sm text-text-gray-tertiary">
          <p className="text-label-sm capitalize text-text-gray-tertiary font-label-sm-strong!">
            {job?.workplace || 'N/A'}
          </p>
          <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
          <p className="text-label-sm capitalize text-text-gray-tertiary font-label-sm-strong!">
            {job?.period || 'N/A'}
          </p>
          <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
          <p className="text-label-sm capitalize text-text-gray-tertiary font-label-sm-strong!">
            {job?.workingDays || 'N/A'} days
          </p>
          <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
          <p className="text-label-sm capitalize text-text-gray-tertiary font-label-sm-strong!">
            £ {job?.salary || 0}
          </p>
        </div>
      </div>
      {isEmployer ? (
        <></>
      ) : (
        <Link href={`/candidate/job/${job?._id}/apply`}>
          <Button className=" min-w-fit cursor-pointer hover:bg-bg-gray-soft-primary bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!">
            <Pointer />
            <span>Apply Now</span>
          </Button>
        </Link>
      )}
    </div>
  );
}
