'use client';
import React, { useCallback } from 'react';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '../../../../../../components/empty-box';
import { useInfiniteAppliedJobs } from '@/services/job-profile';

const SCROLL_THRESHOLD = 80;

export default function AppliedJobs() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isJobLoading,
  } = useInfiniteAppliedJobs({});

  const jobs = data?.pages.flatMap((page) => page.docs) ?? [];

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;

      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (
        distanceFromBottom < SCROLL_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );

  return (
    <div>
      <div
        onScroll={handleScroll}
        className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-spacing-4xl"
      >
        {isJobLoading ? (
          <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
            {[1, 2, 3, 4].map((item) => (
              <JobItemSkelaton key={item} />
            ))}
          </div>
        ) : Boolean(jobs?.length) ? (
          <>
            <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
              {jobs?.map((item) => (
                <CardJobItem
                  key={item._id}
                  job={item}
                  isShowAppliedBtn={false}
                  isShowFavouriteBtn={false}
                />
              ))}
            </div>
            {isFetchingNextPage && (
              <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
                {[1, 2].map((item) => (
                  <JobItemSkelaton key={item} />
                ))}
              </div>
            )}
          </>
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
      </div>
    </div>
  );
}