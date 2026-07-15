'use client';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '../../../../../../components/empty-box';
import PaginationComponent from './pagination-component';
import { JobData } from '@/services/jobs/job.type';
import { useFavourites } from '@/services/favourite/favourite.client';
import { useState } from 'react';
export default function SavedJobLists() {
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

  console.log(favourites, 'favourites');

  return (
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
  );
}
