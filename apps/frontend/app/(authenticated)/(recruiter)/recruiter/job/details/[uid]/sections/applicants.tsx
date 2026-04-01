'use client';
import { cn } from '@/lib/utils';
import {
  Ellipsis,
  EllipsisVertical,
  LayoutGrid,
  Plus,
  TextAlignJustify,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Kanban from './kanban/kanban';

export default function Applicants() {
  const [isMonthView, setIsMonthView] = useState(false);
  return (
    <div className="space-y-spacing-4xl">
      {/* header section */}
      <div className=" flex justify-between items-center">
        <p className=" text-label-xl font-label-xl-strong! text-text-gray-secondary">
          Applicants
        </p>
        <div className=" flex items-center gap-spacing-2xl">
          <Button className="flex gap-spacing-2xs items-center bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
            <Plus /> Add Status
          </Button>
          <div className=" border border-border-gray-primary bg-bg-gray-soft-primary overflow-hidden rounded-lg h-10 flex items-center divide-x divide-border-gray-primary">
            <span
              onClick={() => setIsMonthView(false)}
              className={cn(
                ' h-full min-w-[120px] px-spacing-xl flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary',
                !isMonthView && 'bg-bg-gray-soft-secondary',
              )}
            >
              <LayoutGrid className=" size-4" />

              <span className=" text-label-sm font-label-sm-strong! ">
                Kanban View
              </span>
            </span>
            <span
              onClick={() => setIsMonthView(true)}
              className={cn(
                'h-full min-w-[120px] px-spacing-xl flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary',
                isMonthView && 'bg-bg-gray-soft-secondary',
              )}
            >
              <TextAlignJustify className=" size-4" />

              <span className=" text-label-sm font-label-sm-strong! ">
                List View
              </span>
            </span>
          </div>
        </div>
      </div>
      {/* content part  */}
      <div className="">
        <Kanban />
      </div>
    </div>
  );
}
