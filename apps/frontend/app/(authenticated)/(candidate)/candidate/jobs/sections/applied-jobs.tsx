'use client';
import React, { useState } from 'react';

import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useJobs } from '@/services/jobs/jobs.client';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '../../../../../../components/empty-box';
import PaginationComponent from './pagination-component';
import { useAppliedJobs } from '@/services/job-profile';

export default function AppliedJobs() {
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
          {jobs?.map((item) => (
            <CardJobItem key={item._id} job={item} isApplied={true} />
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
