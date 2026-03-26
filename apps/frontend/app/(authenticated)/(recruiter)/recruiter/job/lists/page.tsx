'use client';
import React, { useState } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import EmptyStateSVG from '@/public/images/Empty_State.svg';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

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
import {
  Dot,
  Ellipsis,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  TextAlignJustify,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import Image from 'next/image';

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

  const [isListView, setIsListView] = useState(false);

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
        <div className=" flex justify-between items-center gap-spacing-2xl">
          <div className=" space-y-spacing-2xs">
            <h3 className=" text-body-xl font-body-xl-strong! text-text-gray-primary">
              Create a job post
            </h3>
            <p className=" capitalize text-label-sm text-text-gray-tertiary">
              create and view Your all jobs
            </p>
          </div>
          <div className=" flex items-center gap-spacing-2xl">
            <Button className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
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
            <Tabs
              defaultValue={tabs[0].value}
              className="w-full gap-spacing-4xl"
            >
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
                <InputGroup className=" max-w-[400px] h-10 rounded-lg shadow-xs border-border-gray-primary">
                  <InputGroupInput type="text" placeholder="Search..." />
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
                  {isListView ? (
                    <DataTable columns={userColumns} data={demoUsers} />
                  ) : (
                    <div className=" grid grid-cols-2 gap-spacing-4xl">
                      {[1, 2, 3].map((item) => (
                        <div
                          key={item}
                          className="border border-border-gray-secondary rounded-2xl bg-bg-gray-soft-primary shadow-xs"
                        >
                          <div className=" p-spacing-4xl space-y-spacing-4xl">
                            <div className=" space-y-spacing-sm">
                              <div className="flex justify-between items-center gap-spacing-4xl">
                                <p className=" text-label-sm text-text-gray-tertiary">
                                  XJ-486
                                </p>
                                <span>
                                  <Ellipsis className="w-5 h-5 text-text-gray-primary" />
                                </span>
                              </div>

                              <Badge className=" text-label-sm font-label-sm-strong! text-others-fuchsia-dark bg-others-fuchsia-light">
                                Archive
                              </Badge>

                              <div className=" space-y-spacing-2xs">
                                <h4 className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                                  UI/UX Designer Wanted – Join Our Creative
                                  Team!
                                </h4>
                                <div className=" flex items-center gap-spacing-xs">
                                  <div className="flex items-center gap-spacing-2xs text-text-gray-tertiary">
                                    <MapPin className=" text-fg-gray-tertiary size-4" />
                                    <p className="text-body-sm ">
                                      Shaw and Crompton, UK
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-spacing-2xs text-text-gray-tertiary">
                                    <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
                                    <p className="text-body-sm ">Hybrid</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className=" flex justify-between items-center">
                              <div className=" flex items-center gap-spacing-sm ">
                                <p className="text-label-sm font-body-sm-strong!  text-text-gray-primary">
                                  Applied
                                </p>
                                <p className=" text-body-sm text-text-gray-tertiary">
                                  88
                                </p>
                              </div>
                              <div className="flex items-center">
                                {[1, 2, 3, 4].map((item) => (
                                  <Avatar
                                    key={item}
                                    className=" size-6 -ml-1.5 first:ml-0 border border-white"
                                  >
                                    <AvatarImage
                                      src="https://github.com/shadcn.png"
                                      alt="@shadcn"
                                    />
                                    <AvatarFallback>CN</AvatarFallback>
                                  </Avatar>
                                ))}
                                <Avatar className="-ml-1.5 size-6 bg-gray-200 border border-white text-body-xs">
                                  <AvatarFallback>+7</AvatarFallback>
                                </Avatar>
                              </div>
                            </div>
                          </div>
                          <div className=" border-t border-border-gray-secondary flex justify-between items-center gap-2.5 px-spacing-4xl py-spacing-2xl">
                            <p className=" text-body-sm text-text-gray-tertiary">
                              Nov 26, 2025
                            </p>
                            <p className=" text-body-sm text-text-gray-tertiary">
                              Active
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* <Empty className="border border-dashed p-spacing-4xl!">
                    <EmptyHeader>
                      <div className="">
                        <Image
                          className="max-h-50 max-w-[250px] w-[250px] h-50 rounded-full"
                          alt="EmptyStateSVG"
                          src={EmptyStateSVG}
                          width={250}
                          height={200}
                        />
                        <EmptyTitle className=" text-label-xl font-label-xs-strong! text-text-gray-primary">
                          No Jobs are Post Yet!
                        </EmptyTitle>
                      </div>
                      <EmptyDescription className=" text-label-md text-text-gray-quaternary">
                        Currently, there are no job postings available.
                      </EmptyDescription>
                    </EmptyHeader>
                    <EmptyContent>
                      <Button className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
                        <Plus />
                        <span>Create New</span>
                      </Button>
                    </EmptyContent>
                  </Empty> */}

                  <Pagination
                    className={cn(
                      'py-spacing-4xl',
                      isListView && 'px-spacing-4xl border-t',
                    )}
                  >
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
                </TabsContent>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
