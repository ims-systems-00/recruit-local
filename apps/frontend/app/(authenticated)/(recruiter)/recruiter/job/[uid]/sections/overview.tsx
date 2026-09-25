'use client';
import { cn } from '@/lib/utils';
import {
  Ellipsis,
  EllipsisVertical,
  LayoutGrid,
  TextAlignJustify,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import ApplicantsChart from './applicants-chart';
import HiringChart from './hiring-chart';
import ExperienceChart from './experience-chart';
import DefaultImgForJobOverview from '@/public/images/DefaultImgForJobOverview.png';
import Image from 'next/image';
import EmptyBox from '@/components/empty-box';

export default function Overview() {
  const [isMonthView, setIsMonthView] = useState(false);

  return (
    <div className="space-y-spacing-2xl sm:space-y-spacing-3xl lg:space-y-spacing-4xl">
      {/* Header */}
      <div className="flex flex-col xs:flex-row sm:flex-row flex-wrap sm:flex-nowrap justify-between items-start xs:items-center sm:items-center gap-spacing-lg sm:gap-spacing-2xl">
        <p className="text-label-xl font-label-xl-strong! text-text-gray-secondary">
          Overview
        </p>
        <div className="w-full sm:w-auto border border-border-gray-primary bg-bg-gray-soft-primary overflow-hidden rounded-lg h-10 flex items-center divide-x divide-border-gray-primary">
          <button
            type="button"
            onClick={() => setIsMonthView(false)}
            className={cn(
              'h-full flex-1 sm:w-[120px] px-spacing-lg sm:px-spacing-0 flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary transition-colors',
              !isMonthView && 'bg-bg-gray-soft-secondary font-medium',
            )}
          >
            <LayoutGrid className="size-4 shrink-0" />
            <span className="text-label-sm font-label-sm-strong! whitespace-nowrap">
              This week
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsMonthView(true)}
            className={cn(
              'h-full flex-1 sm:w-[120px] px-spacing-lg sm:px-spacing-0 flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary transition-colors',
              isMonthView && 'bg-bg-gray-soft-secondary font-medium',
            )}
          >
            <TextAlignJustify className="size-4 shrink-0" />
            <span className="text-label-sm font-label-sm-strong! whitespace-nowrap">
              This Month
            </span>
          </button>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-2xl sm:p-spacing-3xl lg:p-spacing-4xl space-y-spacing-sm">
          <div className="flex items-center justify-between gap-spacing-3xl">
            <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
              Total Application
            </p>
            <button type="button" aria-label="More options">
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary cursor-pointer" />
            </button>
          </div>
          <div className="flex flex-wrap items-baseline sm:items-end justify-between gap-spacing-sm sm:gap-spacing-3xl">
            <p className="text-heading-md font-heading-md-strong! text-text-gray-primary">
              572
            </p>
            <div className="flex flex-wrap items-center gap-spacing-2xs text-label-sm font-label-sm-strong!">
              <div className="flex items-center gap-spacing-2xs text-text-success">
                <TrendingUp className="size-4 shrink-0" />
                <span>25%</span>
              </div>
              <span className="text-text-gray-tertiary">vs previous week</span>
            </div>
          </div>
        </div>

        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-2xl sm:p-spacing-3xl lg:p-spacing-4xl space-y-spacing-sm">
          <div className="flex items-center justify-between gap-spacing-3xl">
            <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
              New Applicants
            </p>
            <button type="button" aria-label="More options">
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary cursor-pointer" />
            </button>
          </div>
          <div className="flex flex-wrap items-baseline sm:items-end justify-between gap-spacing-sm sm:gap-spacing-3xl">
            <p className="text-heading-md font-heading-md-strong! text-text-gray-primary">
              572
            </p>
            <div className="flex flex-wrap items-center gap-spacing-2xs text-label-sm font-label-sm-strong!">
              <div className="flex items-center gap-spacing-2xs text-text-success">
                <TrendingUp className="size-4 shrink-0" />
                <span>25%</span>
              </div>
              <span className="text-text-gray-tertiary">vs previous week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-2xl sm:p-spacing-3xl lg:p-spacing-4xl space-y-spacing-2xl sm:space-y-spacing-3xl lg:space-y-spacing-4xl min-w-0">
          <div className="flex items-center justify-between gap-spacing-3xl">
            <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              Applications
            </h4>
            <button type="button" aria-label="More options">
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary cursor-pointer" />
            </button>
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            <ApplicantsChart />
          </div>
        </div>

        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-2xl sm:p-spacing-3xl lg:p-spacing-4xl space-y-spacing-2xl sm:space-y-spacing-3xl lg:space-y-spacing-4xl min-w-0">
          <div className="flex items-center justify-between gap-spacing-3xl">
            <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              Hiring Activity
            </h4>
            <button type="button" aria-label="More options">
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary cursor-pointer" />
            </button>
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            <HiringChart />
          </div>
        </div>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-2xl sm:p-spacing-3xl lg:p-spacing-4xl space-y-spacing-2xl sm:space-y-spacing-3xl lg:space-y-spacing-4xl min-w-0">
          <div className="flex items-start justify-between gap-spacing-lg sm:gap-spacing-3xl">
            <div>
              <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                Interviewer Experience
              </h4>
              <p className="text-body-sm text-text-gray-tertiary mt-spacing-2xs">
                Displays how candidates move through each stage of the
                interview.
              </p>
            </div>
            <button type="button" aria-label="More options">
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary shrink-0 cursor-pointer" />
            </button>
          </div>
          <div className="w-full min-w-0 overflow-hidden">
            <ExperienceChart />
          </div>
        </div>

        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-2xl sm:p-spacing-3xl lg:p-spacing-4xl space-y-spacing-2xl sm:space-y-spacing-3xl lg:space-y-spacing-4xl min-w-0">
          <div className="flex items-center justify-between gap-spacing-3xl">
            <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
              New Applicants this Week
            </h4>
          </div>
          <div className="space-y-spacing-lg sm:space-y-spacing-2xl">
            <p className="text-label-sm font-label-sm-strong! text-text-gray-primary">
              Candidates
            </p>
            <div className="space-y-spacing-lg sm:space-y-spacing-2xl max-h-[265px] overflow-y-auto pr-spacing-3xs">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="flex items-center justify-between gap-spacing-lg"
                >
                  <div className="flex items-center gap-spacing-lg sm:gap-spacing-lg min-w-0">
                    <div className="min-w-10 shrink-0">
                      <Image
                        className="max-h-10 max-w-10 w-10 h-10 rounded-full object-cover"
                        alt="Logo"
                        src={DefaultImgForJobOverview}
                        width={40}
                        height={40}
                      />
                    </div>
                    <p className="text-label-sm font-label-sm-strong! text-text-gray-primary truncate">
                      Helena Sia
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-label-xs font-label-xs-strong! text-text-gray-secondary hover:text-text-gray-primary shrink-0 transition-colors cursor-pointer"
                  >
                    View More
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
