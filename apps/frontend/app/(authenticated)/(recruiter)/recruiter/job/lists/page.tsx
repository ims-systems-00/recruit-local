'use client';
import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/table/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search } from 'lucide-react';

export const userColumns: ColumnDef<User>[] = [
  {
    accessorKey: 'id',
    header: 'ID',
    size: 80,
  },
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <span
        className={
          row.original.status === 'active'
            ? 'text-green-600 font-medium'
            : 'text-red-600 font-medium'
        }
      >
        {row.original.status}
      </span>
    ),
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

export default function JobLists() {
  const tabs = [
    {
      value: 'All',
      label: 'All',
    },
    {
      value: 'active-jobs',
      label: 'Active Jobs',
    },
    {
      value: 'archives-jobs',
      label: 'Archives jobs',
    },
    {
      value: 'drafts-jobs',
      label: 'Drafts jobs',
    },
  ];
  return (
    <div>
      <div className=" py-spacing-lg px-spacing-4xl border-b border-border-gray-secondary">
        <Breadcrumb className=" min-h-10 flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                Job Listing
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className=" p-spacing-4xl">
        <h3 className=" text-body-lg font-body-lg-strong! text-text-gray-primary">
          Create a job post
        </h3>
        <div className=" py-spacing-4xl">
          <div className=" border border-border-gray-primary rounded-2xl overflow-hidden">
            <Tabs defaultValue={tabs[0].value} className="w-full gap-0">
              <div className=" p-spacing-4xl flex justify-between items-center gap-spacing-4xl">
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
                <InputGroup className=" max-w-[400px] h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput type="text" placeholder="Search..." />
                  <InputGroupAddon>
                    <Search className=" text-fg-gray-tertiary" />
                  </InputGroupAddon>
                </InputGroup>
              </div>

              {tabs.map((tab) => (
                <TabsContent key={tab.value} value={tab.value}>
                  <DataTable columns={userColumns} data={demoUsers} />
                </TabsContent>
              ))}
              <Pagination className=" px-spacing-2xl py-spacing-4xl">
                <PaginationContent className=" justify-between w-full">
                  <PaginationItem>
                    <PaginationPrevious
                      className=" border border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                      href="#"
                    />
                  </PaginationItem>
                  <div className=" flex items-center gap-x-spacing-xs ">
                    <PaginationItem>
                      <PaginationLink
                        className=" w-10 h-10 rounded-lg flex justify-center items-center"
                        href="#"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        className=" w-10 h-10 border-0 rounded-lg flex justify-center items-center bg-bg-gray-soft-secondary"
                        href="#"
                        isActive
                      >
                        2
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationLink
                        className=" w-10 h-10 rounded-lg flex justify-center items-center"
                        href="#"
                      >
                        3
                      </PaginationLink>
                    </PaginationItem>
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  </div>
                  <PaginationItem>
                    <PaginationNext
                      className=" border border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                      href="#"
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
