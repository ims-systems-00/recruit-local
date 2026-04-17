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

export default function WorkExperienceItem() {
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
              UI/UX Designer
            </p>
            <div className="flex items-center gap-spacing-sm">
              <span className="text-label-sm text-text-gray-tertiary">
                ShikhoBD
              </span>
              <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

              <span className="text-label-sm text-text-gray-tertiary">
                Full Time
              </span>
            </div>
            <div className="flex items-center gap-spacing-sm">
              <span className="text-label-sm text-text-gray-tertiary">
                Oct 2024 - Feb 2025
              </span>
              <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

              <span className="text-label-sm text-text-gray-tertiary">
                4 mos
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
            <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Delete
            </DropdownMenuItem>

            <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
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
