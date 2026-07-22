'use client';
import React, { useState } from 'react';
import EmptyBox from '@/components/empty-box';
import { useFavourites } from '@/services/favourite/favourite.client';
import { JobData } from '@/services/jobs/job.type';

import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import PaginationComponent from './pagination-component';

export default function Saves() {
  const [page, setPage] = useState(1);

  const {
    favourites,
    isLoading: isFavouriteLoading,
    pagination,
  } = useFavourites({
    page: page,
    limit: 10,
    itemType: 'jobs',
  });

  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center">
        <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
          Saves
        </h4>
      </div>
      <div>
        {isFavouriteLoading ? (
          <div className=" grid grid-cols-2 gap-spacing-4xl">
            {[1, 2, 3, 4].map((item) => (
              <JobItemSkelaton key={item} />
            ))}
          </div>
        ) : Boolean(favourites?.length) ? (
          <div className=" grid grid-cols-2 gap-spacing-4xl">
            {favourites?.map((item) => (
              <CardJobItem
                key={item._id}
                job={item?.item as JobData}
                isShowAppliedBtn={false}
              />
            ))}
          </div>
        ) : (
          <EmptyBox
            title="No Saved Jobs Yet!"
            description="Currently, there are no saved jobs available."
          ></EmptyBox>
        )}

        {Boolean(favourites?.length) && pagination?.totalPages && (
          <PaginationComponent
            meta={pagination}
            onPageChange={(pageNum) => {
              setPage(pageNum);
            }}
          />
        )}
      </div>
    </div>
  );
}
