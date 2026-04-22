import { DataTable } from '@/components/table/data-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatDate } from '@/lib/utils';
import { useApplications } from '@/services/application/application.client';
import { Application } from '@/services/application/application.type';
import { ColumnDef } from '@tanstack/react-table';
import React, { useState } from 'react';
import PaginationComponent from './pagination-component';
import { TableSkeleton } from './table-skeleton';
import EmptyBox from '@/components/empty-box';

export const userColumns: ColumnDef<Application>[] = [
  {
    accessorKey: 'jobProfile.name',
    header: 'Applicants',
    cell: ({ row }) => (
      <div className=" flex items-center gap-spacing-lg">
        <Avatar className=" size-10 border border-border-gray-primary">
          {/* <AvatarImage src={row.original.jobProfile.profileImageSrc} /> */}
          <AvatarFallback>
            {row.original.jobProfile.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className=" text-label-sm font-label-sm-strong! text-text-gray-primary">
            {row.original.jobProfile.name}
          </p>
          <p className=" text-label-sm  text-text-gray-primary">
            {row.original.jobProfile.email}
          </p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'rank',
    header: 'Rank ID',
  },

  {
    accessorKey: 'status.label',
    header: 'Status',
    cell: ({ row }) => (
      <span className=" w-fit flex items-center justify-center px-spacing-md py-spacing-3xs rounded-full text-label-sm font-label-sm-strong! text-others-fuchsia-dark bg-others-fuchsia-fuchsia-zero border border-others-fuchsia-light">
        {row.original.status.label}
      </span>
    ),
  },
  {
    accessorKey: 'appliedAt',
    header: 'Applied date',
    cell: ({ row }) => {
      const value = formatDate(row?.original?.appliedAt || undefined);

      return <span>{value || 'N/A'}</span>;
    },
  },
];
export default function ApplicantListsView({ jobId }: { jobId: string }) {
  const [page, setPage] = useState(1);
  const { applications, isLoading, pagination } = useApplications({
    jobId,
    page,
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-border-gray-primary space-y-spacing-4xl">
      {isLoading ? (
        <TableSkeleton columns={userColumns.length} rows={5} />
      ) : (
        <>
          {Boolean(applications?.length) ? (
            <DataTable columns={userColumns} data={applications} />
          ) : (
            <EmptyBox
              title="No Applicants Found"
              description="No applicants found for this job."
            />
          )}
          {Boolean(applications?.length) && pagination?.totalPages && (
            <PaginationComponent
              meta={pagination}
              onPageChange={(pageNum) => {
                setPage(pageNum);
              }}
            />
          )}
        </>
      )}
    </div>
  );
}
