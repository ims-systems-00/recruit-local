'use client';
import React, { useCallback } from 'react';

import { useInfiniteAppliedJobs } from '@/services/job-profile';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '@/components/empty-box';

const SCROLL_THRESHOLD = 80;

export default function Applied() {
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
          <div className=" grid sm:grid-cols-2 gap-spacing-4xl">
            {[1, 2, 3, 4].map((item) => (
              <JobItemSkelaton key={item} />
            ))}
          </div>
        ) : Boolean(jobs?.length) ? (
          <>
            <div className=" grid sm:grid-cols-2 gap-spacing-4xl">
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
              <div className=" grid sm:grid-cols-2 gap-spacing-4xl">
                {[1, 2].map((item) => (
                  <JobItemSkelaton key={item} />
                ))}
              </div>
            )}
          </>
        ) : (
          <EmptyBox
            title="No Applied Jobs Yet!"
            description="Currently, there are no applied jobs available."
          />
        )}
      </div>
    </div>
  );
}