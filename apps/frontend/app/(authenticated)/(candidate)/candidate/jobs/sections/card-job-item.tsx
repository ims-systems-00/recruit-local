'use client';
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Bookmark, MapPin, Pointer } from 'lucide-react';
import { JobData } from '@/services/jobs/job.type';
import { cn, formatDate } from '@/lib/utils';
import DefaultImgForJob from '@/public/images/job_default.png';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

export default function CardJobItem({ job }: { job: JobData }) {
  console.log('job', job);

  return (
    <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs">
      <div className=" p-spacing-4xl space-y-spacing-4xl">
        <div className=" flex items-center gap-spacing-sm">
          <div className=" min-w-12 max-w-12 ">
            <Image
              className="max-h-12 max-w-12 w-12 h-12 rounded-full "
              alt="Logo"
              src={DefaultImgForJob}
              width={48}
              height={48}
            />
          </div>
          <div className=" space-y-spacing-2xs">
            <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              {job?.title || 'N/A'}
            </h4>
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
          <Button className=" bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!">
            <Pointer />
            <span>Apply Now</span>
          </Button>
          <Button className=" w-9! p-spacing-0! bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!">
            <Bookmark />
          </Button>
        </div>
      </div>
    </div>
  );
}
