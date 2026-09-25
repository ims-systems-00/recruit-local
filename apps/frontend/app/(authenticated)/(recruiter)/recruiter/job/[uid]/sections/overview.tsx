'use client';
import { cn } from '@/lib/utils';
import {
  LayoutGrid,
  TextAlignJustify,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import React, { useState } from 'react';
import Link from 'next/link';
import ApplicantsChart from './applicants-chart';
import HiringChart from './hiring-chart';
import ExperienceChart from './experience-chart';
import EmptyBox from '@/components/empty-box';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  useApplications,
  useJobOverview,
} from '@/services/application/application.client';
import type { JobOverviewRange } from '@/services/application/application.type';

/** How many of the latest applications to scan for the "new this period" list. */
const RECENT_LIMIT = 10;

const cardClass =
  'border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs p-spacing-2xl sm:p-spacing-3xl lg:p-spacing-4xl';
const chartCardClass = cn(
  cardClass,
  'space-y-spacing-2xl sm:space-y-spacing-3xl lg:space-y-spacing-4xl min-w-0',
);

export default function Overview({ jobId }: { jobId: string }) {
  const [range, setRange] = useState<JobOverviewRange>('week');
  const { overview, isLoading, isError } = useJobOverview(jobId, range);
  const { applications, isLoading: isRecentLoading } = useApplications({
    jobId,
    limit: RECENT_LIMIT,
  });

  const periodLabel = range === 'week' ? 'week' : 'month';
  const recentApplicants = overview
    ? applications.filter(
        (a) =>
          a.appliedAt &&
          new Date(a.appliedAt).getTime() >=
            new Date(overview.periodStart).getTime(),
      )
    : [];

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
            onClick={() => setRange('week')}
            className={cn(
              'h-full flex-1 sm:w-[120px] px-spacing-lg sm:px-spacing-0 flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary transition-colors',
              range === 'week' && 'bg-bg-gray-soft-secondary font-medium',
            )}
          >
            <LayoutGrid className="size-4 shrink-0" />
            <span className="text-label-sm font-label-sm-strong! whitespace-nowrap">
              This week
            </span>
          </button>
          <button
            type="button"
            onClick={() => setRange('month')}
            className={cn(
              'h-full flex-1 sm:w-[120px] px-spacing-lg sm:px-spacing-0 flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary transition-colors',
              range === 'month' && 'bg-bg-gray-soft-secondary font-medium',
            )}
          >
            <TextAlignJustify className="size-4 shrink-0" />
            <span className="text-label-sm font-label-sm-strong! whitespace-nowrap">
              This Month
            </span>
          </button>
        </div>
      </div>

      {isError ? (
        <EmptyBox
          title="Couldn't load the overview"
          description="Something went wrong while fetching this job's numbers. Please try again."
        />
      ) : isLoading || !overview ? (
        <OverviewSkeleton />
      ) : (
        <>
          {/* Top Metric Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
            <MetricCard
              title="Total Application"
              value={overview.totals.total}
              changePct={overview.totals.totalChangePct}
              periodLabel={periodLabel}
            />
            <MetricCard
              title="New Applicants"
              value={overview.totals.newApplicants}
              changePct={overview.totals.newChangePct}
              periodLabel={periodLabel}
            />
          </div>

          {/* Main Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
            <div className={chartCardClass}>
              <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                Applications
              </h4>
              <div className="w-full min-w-0 overflow-hidden">
                <ApplicantsChart data={overview.daily} range={range} />
              </div>
            </div>

            {overview.stages && (
              <div className={chartCardClass}>
                <div>
                  <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                    Applicants by Stage
                  </h4>
                  <p className="text-body-sm text-text-gray-tertiary mt-spacing-2xs">
                    Where this job&apos;s applicants currently sit on the board.
                  </p>
                </div>
                <div className="w-full min-w-0 overflow-hidden">
                  <HiringChart stages={overview.stages} />
                </div>
              </div>
            )}
          </div>

          {/* Bottom Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
            {overview.matchScore && (
              <div className={chartCardClass}>
                <div>
                  <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                    Match Score
                  </h4>
                  <p className="text-body-sm text-text-gray-tertiary mt-spacing-2xs">
                    How well applicants match this job&apos;s requirements.
                  </p>
                </div>
                <div className="w-full min-w-0 overflow-hidden">
                  <ExperienceChart matchScore={overview.matchScore} />
                </div>
              </div>
            )}

            <div className={chartCardClass}>
              <h4 className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                New Applicants this {range === 'week' ? 'Week' : 'Month'}
              </h4>
              <div className="space-y-spacing-lg sm:space-y-spacing-2xl">
                <p className="text-label-sm font-label-sm-strong! text-text-gray-primary">
                  Candidates
                </p>
                <div className="space-y-spacing-lg sm:space-y-spacing-2xl max-h-[265px] overflow-y-auto pr-spacing-3xs">
                  {isRecentLoading ? (
                    [1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-10 w-full" />
                    ))
                  ) : recentApplicants.length === 0 ? (
                    <p className="text-body-sm text-text-gray-tertiary">
                      No new applicants this {periodLabel}.
                    </p>
                  ) : (
                    recentApplicants.map((applicant) => (
                      <div
                        key={applicant._id}
                        className="flex items-center justify-between gap-spacing-lg"
                      >
                        <div className="flex items-center gap-spacing-lg min-w-0">
                          <Avatar className="size-10 shrink-0 border border-border-gray-primary items-center justify-center">
                            <AvatarFallback>
                              {applicant.jobProfile?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <p className="text-label-sm font-label-sm-strong! text-text-gray-primary truncate">
                            {applicant.jobProfile?.name || 'Unnamed applicant'}
                          </p>
                        </div>
                        <Link
                          href={`/recruiter/job/${jobId}/applicants/${applicant._id}`}
                          className="text-label-xs font-label-xs-strong! text-text-gray-secondary hover:text-text-gray-primary shrink-0 transition-colors"
                        >
                          View More
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MetricCard({
  title,
  value,
  changePct,
  periodLabel,
}: {
  title: string;
  value: number;
  changePct: number | null;
  periodLabel: string;
}) {
  const isDown = changePct !== null && changePct < 0;
  const TrendIcon = isDown ? TrendingDown : TrendingUp;

  return (
    <div className={cn(cardClass, 'space-y-spacing-sm')}>
      <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
        {title}
      </p>
      <div className="flex flex-wrap items-baseline sm:items-end justify-between gap-spacing-sm sm:gap-spacing-3xl">
        <p className="text-heading-md font-heading-md-strong! text-text-gray-primary">
          {value}
        </p>
        {changePct !== null && (
          <div className="flex flex-wrap items-center gap-spacing-2xs text-label-sm font-label-sm-strong!">
            <div
              className={cn(
                'flex items-center gap-spacing-2xs',
                isDown ? 'text-text-error-primary' : 'text-text-success',
              )}
            >
              <TrendIcon className="size-4 shrink-0" />
              <span>{Math.abs(changePct)}%</span>
            </div>
            <span className="text-text-gray-tertiary">
              vs previous {periodLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-spacing-2xl sm:gap-spacing-3xl lg:gap-spacing-4xl">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </>
  );
}
