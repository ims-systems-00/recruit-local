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
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary" />
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
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary" />
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

      <div className=" grid grid-cols-2 gap-spacing-4xl">
        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-4xl space-y-spacing-4xl">
          <div className=" flex items-center justify-between gap-spacing-3xl">
            <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              Applications
            </h4>
            <span>
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary" />
            </span>
          </div>
          <div>
            <ApplicantsChart />
          </div>
        </div>

        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-4xl space-y-spacing-4xl">
          <div className=" flex items-center justify-between gap-spacing-3xl">
            <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              Hiring Activity
            </h4>
            <span>
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary" />
            </span>
          </div>
          <div>
            <HiringChart />
          </div>
        </div>
      </div>
      <div className=" grid grid-cols-2 gap-spacing-4xl">
        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-4xl space-y-spacing-4xl">
          <div className=" flex items-start justify-between gap-spacing-3xl">
            <div>
              <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                Interviewer Experience
              </h4>
              <p className=" text-body-sm text-text-gray-tertiary">
                Displays how candidates move through each stage of the
                interview.
              </p>
            </div>
            <span>
              <EllipsisVertical className="w-5 h-5 text-text-gray-primary" />
            </span>
          </div>
          <div>
            <ExperienceChart />
          </div>
        </div>

        <div className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-4xl space-y-spacing-4xl">
          <div className=" flex items-center justify-between gap-spacing-3xl">
            <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
              New Applicants this Week
            </h4>
          </div>
          <div className=" space-y-spacing-2xl">
            <p className=" text-label-sm font-label-sm-strong! text-text-gray-primary">
              Candidates
            </p>
            <div className=" space-y-spacing-2xl max-h-[265px] overflow-y-auto">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className=" flex items-center justify-between">
                  <div className=" flex items-center gap-spacing-lg">
                    <div className=" min-w-10">
                      <Image
                        className="max-h-10 max-w-10 w-10 h-10 rounded-full "
                        alt="Logo"
                        src={DefaultImgForJobOverview}
                        width={40}
                        height={40}
                      />
                    </div>
                    <p className=" text-label-sm font-label-sm-strong! text-text-gray-primary">
                      Helena Sia
                    </p>
                  </div>
                  <span className=" text-label-xs font-label-xs-strong! text-text-gray-secondary">
                    View More
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
