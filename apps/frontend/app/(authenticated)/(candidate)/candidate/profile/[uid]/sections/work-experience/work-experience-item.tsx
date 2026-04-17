import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import DefaultImgForWorkExperience from '@/public/images/we_default.png';
import { ExperienceData } from '@/services/experience';
import { differenceInMonths } from 'date-fns';

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

export default function WorkExperienceItem({
  experience,
  onEdit,
  onDelete,
}: {
  experience: ExperienceData;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="bg-bg-gray-soft-primary rounded-2xl border border-border-gray-secondary shadow-xs p-spacing-4xl">
      <div className=" flex justify-between items-start gap-spacing-4xl">
        <div className=" flex gap-spacing-2xl">
          <div className=" min-w-12 max-w-12 ">
            <Image
              className="max-h-12 max-w-12 rounded-full"
              alt="Logo"
              src={DefaultImgForWorkExperience}
              width={48}
              height={48}
            />
          </div>
          <div className=" space-y-spacing-3xs">
            <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
              {experience?.jobTitle || 'N/A'}
            </p>
            <div className="flex items-center gap-spacing-sm">
              <span className="text-label-sm text-text-gray-tertiary">
                {experience?.company || 'N/A'}
              </span>
              <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

              <span className="text-label-sm text-text-gray-tertiary">
                {experience?.employmentType || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-spacing-sm">
              <span className="text-label-sm text-text-gray-tertiary">
                {experience?.startDate
                  ? formatDate(new Date(experience?.startDate))
                  : 'N/A'}{' '}
                -{' '}
                {experience?.endDate
                  ? formatDate(new Date(experience?.endDate))
                  : 'Present'}
              </span>
              <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

              <span className="text-label-sm text-text-gray-tertiary">
                {experience?.startDate && experience?.endDate
                  ? differenceInMonths(
                      new Date(experience?.endDate),
                      new Date(experience?.startDate),
                    )
                  : 0}{' '}
                {experience?.startDate && experience?.endDate
                  ? 'months'
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-fg-gray-secondary flex items-center justify-center cursor-pointer">
              <EllipsisVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-white">
            <DropdownMenuItem
              onClick={onDelete}
              className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Delete
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={onEdit}
              className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              //   onClick={onUpdateJob}
              className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Hide
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
