import { DataTable } from '@/components/table/data-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn, formatDate } from '@/lib/utils';
import { useInfiniteApplications } from '@/services/application/application.client';
import { Application } from '@/services/application/application.type';
import { ColumnDef } from '@tanstack/react-table';
import React, { useCallback } from 'react';
import { TableSkeleton } from './table-skeleton';
import EmptyBox from '@/components/empty-box';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';

const SCROLL_THRESHOLD = 80;

export const userColumns: ColumnDef<Application>[] = [
  {
    accessorKey: 'jobProfile.name',
    header: 'Applicants',
    cell: ({ row }) => (
      <div className=" flex items-center gap-spacing-lg">
        <Avatar className=" size-10 border border-border-gray-primary items-center justify-center">
          {/* <AvatarImage src={row.original.jobProfile.profileImageSrc} /> */}
          <AvatarFallback>
            {row.original.jobProfile?.name?.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <Link
            href={`/candidate/profile/${row.original.jobProfile._id}`}
            className=" text-label-sm font-label-sm-strong! text-text-gray-primary"
          >
            {row.original.jobProfile.name}
          </Link>
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
  {
    accessorKey: 'action',
    header: '',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-fg-gray-secondary flex items-center justify-center cursor-pointer">
              <EllipsisVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32 bg-white">
            <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              <Link
                href={`/recruiter/job/${row?.original?.jobId}/applicants/${row?.original?._id}`}
                className=" w-full"
              >
                View Details
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
export default function ApplicantListsView({ jobId }: { jobId: string }) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteApplications({ jobId });

  const applications = data?.pages.flatMap((page) => page.docs) ?? [];

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
    <div className="overflow-hidden rounded-2xl border border-border-gray-primary">
      <div
        onScroll={handleScroll}
        className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-spacing-4xl"
      >
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
            {isFetchingNextPage && (
              <TableSkeleton columns={userColumns.length} rows={2} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
