'use client';
import React from 'react';
import { Bookmark, Building2, Loader2, Pointer } from 'lucide-react';
import { JobData } from '@/services/jobs/job.type';
import { cn, formatDate } from '@/lib/utils';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useCreateFavourite } from '@/services/favourite/favourite.client';

export default function CardJobItem({
  job,
  isApplied,
}: {
  job: JobData;
  isApplied?: boolean;
}) {
  const { createFavourite, isPending } = useCreateFavourite();
  const onAddFavourite = async () => {
    await createFavourite({
      itemId: job._id,
      itemType: 'jobs',
    });
  };
  return (
    <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs">
      <div className=" p-spacing-4xl space-y-spacing-4xl">
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
            <Link href={`/candidate/job/${job?._id}`}>
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
      <div className=" border-t border-border-gray-secondary flex justify-between items-center gap-2.5 px-spacing-4xl py-spacing-2xl">
        <span className=" rounded-md text-label-sm font-label-sm-strong! text-others-gray-dark flex items-center justify-center py-spacing-3xs px-spacing-md bg-others-gray-gray-zero border border-others-gray-light">
          Applied {job?.totalApplications || 0}
        </span>
        <div className=" flex items-center gap-spacing-lg">
          {isApplied && (
            <Button
              disabled
              className="border-border-brand-primary text-text-brand-primary! cursor-pointer hover:bg-bg-gray-soft-primary bg-bg-gray-soft-primary border  h-9  rounded-lg text-label-sm font-label-sm-strong!"
            >
              Applied
            </Button>
          )}
          {!isApplied && (
            <Link href={`/candidate/job/${job?._id}/apply`}>
              <Button className=" cursor-pointer hover:bg-bg-gray-soft-primary bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!">
                <Pointer />
                <span>Apply Now</span>
              </Button>
            </Link>
          )}
          <Button
            onClick={onAddFavourite}
            disabled={isPending || job?.alreadySaved}
            className={cn(
              'cursor-pointer hover:bg-bg-gray-soft-primary w-9! p-spacing-0! bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!',
              job?.alreadySaved &&
                'text-text-brand-primary! border-border-brand-primary!',
            )}
          >
            {isPending ? <Loader2 className="animate-spin" /> : <Bookmark />}
          </Button>
        </div>
      </div>
    </div>
  );
}
