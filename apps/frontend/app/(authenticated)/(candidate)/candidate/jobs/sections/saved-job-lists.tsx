'use client';
import { useCallback } from 'react';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '../../../../../../components/empty-box';
import { JobData } from '@/services/jobs/job.type';
import { useInfiniteFavourites } from '@/services/favourite/favourite.client';

const SCROLL_THRESHOLD = 80;

export default function SavedJobLists() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isFavouriteLoading,
  } = useInfiniteFavourites({
    limit: 10,
    itemType: 'jobs',
  });

  const favourites = data?.pages.flatMap((page) => page.docs) ?? [];

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
        {isFavouriteLoading ? (
          <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
            {[1, 2, 3, 4].map((item) => (
              <JobItemSkelaton key={item} />
            ))}
          </div>
        ) : Boolean(favourites?.length) ? (
          <>
            <div className=" grid grid-cols-1 sm:grid-cols-2 gap-spacing-4xl">
              {favourites?.map((item) => (
                <CardJobItem
                  key={item._id}
                  job={item?.item as JobData}
                  isShowAppliedBtn={false}
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
            title="No Saved Jobs Yet!"
            description="Currently, there are no saved jobs available."
          ></EmptyBox>
        )}
      </div>
    </div>
  );
}