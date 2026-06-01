'use client';

import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

type PaginationMeta = {
  totalDocs: number;
  limit: number;
  totalPages: number;
  page: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  prevPage: number | null;
  nextPage: number | null;
};

type Props = {
  meta: PaginationMeta;
  onPageChange?: (page: number) => void;
};

export default function PaginationComponent({ meta, onPageChange }: Props) {
  const { page, totalPages, hasPrevPage, hasNextPage } = meta;

  const handlePageClick = (p: number) => {
    if (p === page) return;
    onPageChange?.(p);
  };

  const generatePages = () => {
    const pages: (number | 'ellipsis')[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page > 3) {
        pages.push(1);
        if (page > 4) pages.push('ellipsis');
      }

      for (
        let i = Math.max(1, page - 1);
        i <= Math.min(totalPages, page + 1);
        i++
      ) {
        pages.push(i);
      }

      if (page < totalPages - 2) {
        if (page < totalPages - 3) pages.push('ellipsis');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = generatePages();

  return (
    <Pagination className={cn('py-spacing-4xl px-spacing-4xl border-t')}>
      <PaginationContent className="justify-between w-full">
        {/* Previous */}
        <PaginationItem>
          <PaginationPrevious
            className="border border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
            onClick={() => hasPrevPage && handlePageClick(page - 1)}
          />
        </PaginationItem>

        {/* Pages */}
        <div className="flex items-center gap-x-spacing-xs">
          {pages.map((p, index) => (
            <PaginationItem key={index}>
              {p === 'ellipsis' ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  onClick={() => handlePageClick(p)}
                  isActive={p === page}
                  className={cn(
                    'w-10 h-10 rounded-lg flex justify-center items-center cursor-pointer',
                    p === page && 'bg-bg-gray-soft-secondary',
                  )}
                >
                  {p}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}
        </div>

        {/* Next */}
        <PaginationItem>
          <PaginationNext
            className="border border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
            onClick={() => hasNextPage && handlePageClick(page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
