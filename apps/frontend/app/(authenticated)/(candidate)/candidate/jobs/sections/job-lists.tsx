'use client';
import React from 'react';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useInfiniteJobs } from '@/services/jobs/jobs.client';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '../../../../../../components/empty-box';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { JobListFilters } from '@/services/jobs/job.type';

export default function JobLists({ filters }: { filters: JobListFilters }) {
  const {
    data,
    isLoading: isJobLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteJobs({ ...filters, matched: true });

  const jobs = data?.pages.flatMap((page) => page.docs) ?? [];

  const sentinelRef = useInfiniteScroll({
    enabled: hasNextPage && !isFetchingNextPage && jobs.length > 0,
    onLoadMore: fetchNextPage,
  });

  return (
    <div>
      {isJobLoading ? (
        <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
          {[1, 2, 3, 4].map((item) => (
            <JobItemSkelaton key={item} />
          ))}
        </div>
      ) : Boolean(jobs?.length) ? (
        <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
          {jobs?.map((item) => (
            <CardJobItem key={item._id} job={item} />
          ))}
        </div>
      ) : (
        <EmptyBox
          title="No Jobs Posted Yet!"
          description="Currently, there are no job postings available."
        >
          <Button className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
            <Filter />
            <span>Find Job Now</span>
          </Button>
        </EmptyBox>
      )}

      {Boolean(jobs?.length) && (
        <div ref={sentinelRef} aria-hidden="true">
          {isFetchingNextPage && (
            <div className=" grid grid-cols-1 sm:grid-cols-2 py-spacing-4xl gap-spacing-4xl">
              {[1, 2].map((item) => (
                <JobItemSkelaton key={`loading-${item}`} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
