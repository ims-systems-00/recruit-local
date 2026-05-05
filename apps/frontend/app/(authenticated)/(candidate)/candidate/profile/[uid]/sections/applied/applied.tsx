'use client';
import React, { useState } from 'react';

import { useAppliedJobs } from '@/services/job-profile';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '@/components/empty-box';
import PaginationComponent from './pagination-component';

export default function Applied() {
  const [page, setPage] = useState(1);

  const {
    jobs,
    isLoading: isJobLoading,
    pagination,
  } = useAppliedJobs({ page: page });

  return (
    <div>
      {isJobLoading ? (
        <div className=" grid grid-cols-2 gap-spacing-4xl">
          {[1, 2, 3, 4].map((item) => (
            <JobItemSkelaton key={item} />
          ))}
        </div>
      ) : Boolean(jobs?.length) ? (
        <div className=" grid grid-cols-2 gap-spacing-4xl">
          {jobs?.map((item, index) => (
            <CardJobItem
              key={index}
              job={item}
              isShowAppliedBtn={false}
              isShowFavouriteBtn={false}
            />
          ))}
        </div>
      ) : (
        <EmptyBox
          title="No Applied Jobs Yet!"
          description="Currently, there are no applied jobs available."
        />
      )}

      {Boolean(jobs?.length) && pagination?.totalPages && (
        <PaginationComponent
          meta={pagination}
          onPageChange={(pageNum) => {
            setPage(pageNum);
          }}
        />
      )}
    </div>
  );
}
