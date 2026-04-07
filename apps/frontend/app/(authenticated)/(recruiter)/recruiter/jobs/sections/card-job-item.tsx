import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { JOBS_STATUS_ENUMS } from '@rl/types';
import Link from 'next/link';

export default function CardJobItem({ job }: { job: JobData }) {
  return (
    <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs">
      <div className=" p-spacing-4xl space-y-spacing-4xl">
        <div className=" space-y-spacing-sm">
          <div className="flex justify-between items-center gap-spacing-4xl">
            <p className=" text-label-sm text-text-gray-tertiary">XJ-486</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-fg-gray-secondary flex items-center justify-center  cursor-pointer">
                  <EllipsisVertical size={16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32 bg-white">
                <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  <Link href={`/recruiter/job/${job._id}`} className=" w-full">
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  <Link
                    href={`/recruiter/job/${job._id}/edit`}
                    className=" w-full"
                  >
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
                  Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
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
            <div className=" flex items-center gap-spacing-xs">
              <div className="flex items-center gap-spacing-2xs text-text-gray-tertiary">
                <MapPin className=" text-fg-gray-tertiary size-4" />
                <p className="text-body-sm ">{job?.location || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-spacing-2xs text-text-gray-tertiary">
                <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
                <p className="text-body-sm ">{job?.employmentType || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className=" flex justify-between items-center">
          <div className=" flex items-center gap-spacing-sm ">
            <p className="text-label-sm font-body-sm-strong!  text-text-gray-primary">
              Applied
            </p>
            <p className=" text-body-sm text-text-gray-tertiary">88</p>
          </div>
          <div className="flex items-center">
            {[1, 2, 3, 4].map((item) => (
              <Avatar
                key={item}
                className=" size-6 -ml-1.5 first:ml-0 border border-white"
              >
                <AvatarImage
                  src="https://github.com/shadcn.png"
                  alt="@shadcn"
                />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
            ))}
            <Avatar className="-ml-1.5 size-6 bg-gray-200 border border-white text-body-xs">
              <AvatarFallback>+7</AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
      <div className=" border-t border-border-gray-secondary flex justify-between items-center gap-2.5 px-spacing-4xl py-spacing-2xl">
        <p className=" text-body-sm text-text-gray-tertiary">
          {formatDate(job?.startDate) || 'N/A'}
        </p>
        <div className=" flex items-center gap-spacing-sm ">
          <Switch
            // checked={job.status === JOBS_STATUS_ENUMS.OPEN ? true : false}
            // onCheckedChange={(v) => onUpdate(card.id, { required: v })}
            onClick={(e) => e.stopPropagation()}
            className=" bg-bg-gray-soft-quaternary data-[state=checked]:bg-bg-brand-solid-primary"
          />
          <p className=" text-body-sm text-text-gray-tertiary">Active</p>
        </div>
      </div>
    </div>
  );
}
