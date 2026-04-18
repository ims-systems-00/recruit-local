'use client';
import React, { useMemo, useState } from 'react';

import { ColumnDef } from '@tanstack/react-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatDate } from '@/lib/utils';
import { useJobs } from '@/services/jobs/jobs.client';
import JobItemSkelaton from './job-item-skelaton';
import CardJobItem from './card-job-item';
import EmptyBox from '../../../../../../components/empty-box';
import PaginationComponent from './pagination-component';
import { useDebounce } from '@/hooks/useDebounce';
import { JOBS_STATUS_ENUMS } from '@rl/types';
import { Badge } from '@/components/ui/badge';
import { JobData } from '@/services/jobs/job.type';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import JobAction from './job-action';
import { useAuth } from '@/services/user/user.client';

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
    accessorKey: 'updatedAt',
    header: 'Posted Date',
    cell: ({ row }) => {
      const value = formatDate(row?.original?.updatedAt);

      return <span>{value || 'N/A'}</span>;
    },
  },

  {
    accessorKey: 'action',
    header: '',
    cell: ({ row }) => {
      return <JobAction job={row.original} />;
    },
  },
];

export default function Jobs() {
  const { user } = useAuth();

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
      value: 'all',
      label: 'All Jobs',
    },
    {
      value: 'for',
      label: 'For you',
    },
    {
      value: 'applied',
      label: 'Applied',
    },
    {
      value: 'saved',
      label: 'Saved',
    },
  ];

  return (
    <div className=" p-spacing-4xl">
      <div className=" flex justify-between items-center gap-spacing-2xl">
        <div className=" space-y-spacing-2xs">
          <h3 className=" text-body-xl font-body-xl-strong! text-text-gray-primary">
            Good Morning, {user?.firstName} {user?.lastName}
          </h3>
          <p className=" capitalize text-label-sm text-text-gray-tertiary">
            Find and filter your dream jobs with Recruit Local.
          </p>
        </div>
        <div className=" flex items-center gap-spacing-2xl">
          <InputGroup className=" min-w-[320px] max-w-[320px] h-10 rounded-lg shadow-xs border-border-gray-primary">
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
          <Button className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
            <Filter />
            <span>Filter</span>
          </Button>
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
            </div>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {isJobLoading ? (
                  <div className=" grid grid-cols-2 gap-spacing-4xl">
                    {[1, 2, 3, 4].map((item) => (
                      <JobItemSkelaton key={item} />
                    ))}
                  </div>
                ) : Boolean(jobs?.length) ? (
                  <div className=" grid grid-cols-2 gap-spacing-4xl">
                    {jobs?.map((item) => (
                      <CardJobItem key={item._id} job={item} />
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
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
