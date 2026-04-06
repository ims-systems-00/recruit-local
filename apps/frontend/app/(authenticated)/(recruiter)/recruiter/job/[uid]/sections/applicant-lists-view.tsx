import { DataTable } from '@/components/table/data-table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';
import { ColumnDef } from '@tanstack/react-table';
import React from 'react';

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
export default function ApplicantListsView() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border-gray-primary">
      <DataTable columns={userColumns} data={demoUsers} />
      <Pagination className={cn('py-spacing-4xl px-spacing-4xl border-t')}>
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
    </div>
  );
}
