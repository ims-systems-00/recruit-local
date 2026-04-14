'use client';
import React, { useMemo, useState } from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/table/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Dot,
  Ellipsis,
  EllipsisVertical,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  TextAlignJustify,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import { useCreateJob, useJobs } from '@/services/jobs/jobs.client';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '../../../../../../components/empty-box';
import PaginationComponent from './pagination-component';
import { useDebounce } from '@/hooks/useDebounce';
import { JOBS_STATUS_ENUMS } from '@rl/types';
import { Badge } from '@/components/ui/badge';
import { JobData } from '@/services/jobs/job.type';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableSkeleton } from './table-skeleton';
import Link from 'next/link';

export function getJobStatusBadgeClass(status: string) {
  switch (status) {
    case JOBS_STATUS_ENUMS.DRAFT:
      return cn('text-others-warning-dark bg-others-warning-light');

    case JOBS_STATUS_ENUMS.OPEN:
      return cn('text-others-success-dark bg-others-success-light');

    case JOBS_STATUS_ENUMS.EVALUATION:
      return cn('text-others-gray-dark bg-others-gray-light');

    case JOBS_STATUS_ENUMS.ARCHIVED:
      return cn('text-others-fuchsia-dark bg-others-fuchsia-light');

    default:
      return cn('text-others-gray-dark bg-others-gray-light');
  }
}

export function formatJobStatus(status: string) {
  switch (status) {
    case JOBS_STATUS_ENUMS.DRAFT:
      return 'Draft';
    case JOBS_STATUS_ENUMS.OPEN:
      return 'Open';
    case JOBS_STATUS_ENUMS.EVALUATION:
      return 'Evaluation';
    case JOBS_STATUS_ENUMS.ARCHIVED:
      return 'Archived';
    default:
      return 'N/A';
  }
}

export const userColumns: ColumnDef<JobData>[] = [
  {
    accessorKey: 'title',
    header: 'Job Title',
    size: 80,
  },
  {
    accessorKey: 'reference',
    header: 'Reference',
    cell: ({ row }) => {
      return <span>{row?.original?.reference || 'N/A'}</span>;
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ cell }) => {
      const status = cell.getValue() as JOBS_STATUS_ENUMS;

      return (
        <Badge
          className={cn(
            'text-label-sm font-label-sm-strong!',
            getJobStatusBadgeClass(status),
          )}
        >
          {formatJobStatus(status)}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'location',
    header: 'Location',
    cell: ({ cell }) => {
      const value = cell.getValue() as string | undefined;

      return <span>{value || 'N/A'}</span>;
    },
  },
  {
    accessorKey: 'employmentType',
    header: 'Job Type',
    cell: ({ cell }) => {
      const value = cell.getValue() as string | undefined;

      return <span className=" capitalize">{value || 'N/A'}</span>;
    },
  },

  {
    accessorKey: 'applied',
    header: 'Applied',
    cell: ({ row }) => {
      return <span>{row?.original?.totalApplications || 0}</span>;
    },
  },
  {
    accessorKey: 'applicants',
    header: 'Applicants',
    cell: ({ row }) => {
      return (
        <div className="flex items-center">
          {[1, 2, 3, 4].map((item) => (
            <Avatar
              key={item}
              className=" size-6 -ml-1.5 first:ml-0 border border-white"
            >
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
          ))}
          <Avatar className="-ml-1.5 size-6 bg-gray-200 border border-white text-body-xs">
            <AvatarFallback>+7</AvatarFallback>
          </Avatar>
        </div>
      );
    },
  },
  {
    accessorKey: 'endDate',
    header: 'Posted Date',
    cell: ({ row }) => {
      const value = formatDate(row?.original?.endDate);

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
                href={`/recruiter/job/${row?.original?._id}`}
                className=" w-full"
              >
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              <Link
                href={`/recruiter/job/${row?.original?._id}/edit`}
                className=" w-full"
              >
                Edit
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className=" text-label-sm font-label-sm-strong! text-text-gray-secondary">
              Closed
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
};

export const demoUsers: User[] = [
  {
    id: 1,
    name: 'Tajuddin Molla',
    email: 'tajuddin@example.com',
    role: 'Frontend Developer',
    status: 'active',
  },
  {
    id: 2,
    name: 'Nahid Hasan',
    email: 'nahid@example.com',
    role: 'Backend Developer',
    status: 'inactive',
  },
  {
    id: 3,
    name: 'Sarjis Alam',
    email: 'sarjis@example.com',
    role: 'UI/UX Designer',
    status: 'active',
  },
  {
    id: 4,
    name: 'Kaiyum Ahmed',
    email: 'kaiyum@example.com',
    role: 'Project Manager',
    status: 'active',
  },
];
export default function Jobs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [status, setStatus] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
      status: status === 'All' || !status ? undefined : status,
    }),
    [page, debouncedSearch, status],
  );

  const { jobs, isLoading: isJobLoading, pagination } = useJobs(filters);

  const tabs = [
    {
      value: 'All',
      label: 'All',
    },
    {
      value: JOBS_STATUS_ENUMS.OPEN,
      label: 'Open Jobs',
    },
    {
      value: JOBS_STATUS_ENUMS.CLOSED,
      label: 'Closed jobs',
    },
    {
      value: JOBS_STATUS_ENUMS.DRAFT,
      label: 'Drafts jobs',
    },
  ];

  const [isListView, setIsListView] = useState(false);

  const { onSubmit, isLoading } = useCreateJob();

  const onCreate = () => {
    onSubmit({ title: 'Untitled Title' });
  };

  return (
    <div className=" p-spacing-4xl">
      <div className=" flex justify-between items-center gap-spacing-2xl">
        <div className=" space-y-spacing-2xs">
          <h3 className=" text-body-xl font-body-xl-strong! text-text-gray-primary">
            Job Listing
          </h3>
          <p className=" capitalize text-label-sm text-text-gray-tertiary">
            Create and view Your all jobs
          </p>
        </div>
        <div className=" flex items-center gap-spacing-2xl">
          <Button
            disabled={isLoading}
            onClick={onCreate}
            className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
          >
            <Plus />
            <span>Create New</span>
          </Button>
          <div className=" border border-border-gray-primary bg-bg-gray-soft-primary overflow-hidden rounded-lg h-10 flex items-center divide-x divide-border-gray-primary">
            <span
              onClick={() => setIsListView(false)}
              className={cn(
                ' h-full w-[120px] flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary',
                !isListView && 'bg-bg-gray-soft-secondary',
              )}
            >
              <LayoutGrid className=" size-4" />

              <span className=" text-label-sm font-label-sm-strong! ">
                Grid View
              </span>
            </span>
            <span
              onClick={() => setIsListView(true)}
              className={cn(
                'h-full w-[120px] flex justify-center cursor-pointer gap-spacing-xs items-center text-text-gray-primary',
                isListView && 'bg-bg-gray-soft-secondary',
              )}
            >
              <TextAlignJustify className=" size-4" />

              <span className=" text-label-sm font-label-sm-strong! ">
                List View
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className=" py-spacing-4xl">
        <div className=" overflow-hidden">
          <Tabs defaultValue={tabs[0].value} className="w-full gap-spacing-4xl">
            <div className=" flex justify-between items-center gap-spacing-4xl">
              <TabsList className="bg-bg-gray-soft-secondary h-11 justify-start">
                {tabs.map((tab) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    onClick={() => setStatus(tab.value)}
                    className="px-spacing-lg text-label-md font-label-md-strong! 
                data-[state=active]:shadow-sm 
                flex-0 
                data-[state=active]:bg-bg-gray-soft-primary 
                text-text-gray-quaternary 
                dark:data-[state=active]:text-text-gray-secondary"
                  >
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
              <InputGroup className=" max-w-[400px] h-10 rounded-lg shadow-xs border-border-gray-primary">
                <InputGroupInput
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1); // reset page on search
                  }}
                />
                <InputGroupAddon>
                  <Search className=" text-fg-gray-tertiary" />
                </InputGroupAddon>
              </InputGroup>
            </div>

            {tabs.map((tab) => (
              <TabsContent
                key={tab.value}
                value={tab.value}
                className={cn(
                  isListView &&
                    ' overflow-hidden rounded-2xl border border-border-gray-primary',
                )}
              >
                {isJobLoading ? (
                  isListView ? (
                    <TableSkeleton columns={9} />
                  ) : (
                    <div className=" grid grid-cols-2 gap-spacing-4xl">
                      {[1, 2, 3, 4].map((item) => (
                        <JobItemSkelaton key={item} />
                      ))}
                    </div>
                  )
                ) : Boolean(jobs?.length) ? (
                  isListView ? (
                    <DataTable columns={userColumns} data={jobs} />
                  ) : (
                    <div className=" grid grid-cols-2 gap-spacing-4xl">
                      {jobs?.map((item) => (
                        <CardJobItem key={item._id} job={item} />
                      ))}
                    </div>
                  )
                ) : (
                  <EmptyBox
                    title="No Jobs Posted Yet!"
                    description="Currently, there are no job postings available."
                  >
                    <Button className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
                      <Plus />
                      <span>Create New</span>
                    </Button>
                  </EmptyBox>
                )}

                {Boolean(jobs?.length) && pagination?.totalPages && (
                  <PaginationComponent
                    meta={pagination}
                    onPageChange={(pageNum) => {
                      setPage(pageNum);
                    }}
                    isListView={isListView}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
