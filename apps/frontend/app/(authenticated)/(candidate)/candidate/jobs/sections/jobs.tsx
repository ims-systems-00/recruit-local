'use client';
import React, { useMemo, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/services/user/user.client';
import JobLists from './job-lists';
import { useDebounce } from '@/hooks/useDebounce';

export default function Jobs() {
  const { user } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const debouncedSearch = useDebounce(search, 500);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
      search: debouncedSearch || undefined,
    }),
    [page, debouncedSearch],
  );
  const tabs = [
    {
      value: 'all',
      label: 'All Jobs',
      component: <JobLists filters={filters} onPageChange={setPage} />,
    },
    {
      value: 'for',
      label: 'For you',
      component: <JobLists filters={filters} onPageChange={setPage} />,
    },
    {
      value: 'applied',
      label: 'Applied',
      component: <JobLists filters={filters} onPageChange={setPage} />,
    },
    {
      value: 'saved',
      label: 'Saved',
      component: <JobLists filters={filters} onPageChange={setPage} />,
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
            <span>Filter Jobs</span>
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
                {tab.component}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
