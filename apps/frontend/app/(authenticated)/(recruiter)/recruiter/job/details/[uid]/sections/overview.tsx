'use client';
import { cn } from '@/lib/utils';
import {
  Ellipsis,
  LayoutGrid,
  TextAlignJustify,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';

export default function Overview() {
  const [isMonthView, setIsMonthView] = useState(false);
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center">
        <p className=" text-label-lg text-text-gray-secondary">Overview</p>
        <div className=" border border-border-gray-primary bg-bg-gray-soft-primary overflow-hidden rounded-lg h-10 flex items-center divide-x divide-border-gray-primary">
          <span
            onClick={() => setIsMonthView(false)}
            className={cn(
              ' h-full w-[120px] flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary',
              !isMonthView && 'bg-bg-gray-soft-secondary',
            )}
          >
            <LayoutGrid className=" size-4" />

            <span className=" text-label-sm font-label-sm-strong! ">
              This week
            </span>
          </span>
          <span
            onClick={() => setIsMonthView(true)}
            className={cn(
              'h-full w-[120px] flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary',
              isMonthView && 'bg-bg-gray-soft-secondary',
            )}
          >
            <TextAlignJustify className=" size-4" />

            <span className=" text-label-sm font-label-sm-strong! ">
              This Month
            </span>
          </span>
        </div>
      </div>
      <div className=" grid grid-cols-2 gap-spacing-4xl">
        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-4xl space-y-spacing-sm">
          <div className=" flex items-center justify-between gap-spacing-3xl">
            <p className=" text-label-sm font-label-sm-strong! text-text-gray-tertiary">
              Total Application
            </p>
            <span>
              <Ellipsis className="w-5 h-5 text-text-gray-primary" />
            </span>
          </div>
          <div className=" flex items-end justify-between gap-spacing-3xl">
            <p className=" text-heading-md font-heading-md-strong! text-text-gray-primary">
              572
            </p>
            <div className=" flex gap-spacing-2xs items-center text-label-sm font-label-sm-strong!">
              <div className="flex items-center gap-spacing-2xs text-text-success">
                <TrendingUp />
                <span>25%</span>
              </div>
              <span>vs previous week</span>
            </div>
          </div>
        </div>
        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-4xl space-y-spacing-sm">
          <div className=" flex items-center justify-between gap-spacing-3xl">
            <p className=" text-label-sm font-label-sm-strong! text-text-gray-tertiary">
              New Applicants
            </p>
            <span>
              <Ellipsis className="w-5 h-5 text-text-gray-primary" />
            </span>
          </div>
          <div className=" flex items-end justify-between gap-spacing-3xl">
            <p className=" text-heading-md font-heading-md-strong! text-text-gray-primary">
              572
            </p>
            <div className=" flex gap-spacing-2xs items-center text-label-sm font-label-sm-strong!">
              <div className="flex items-center gap-spacing-2xs text-text-success">
                <TrendingUp />
                <span>25%</span>
              </div>
              <span>vs previous week</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
