'use client';

import React from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination';
import { cn } from '@/lib/utils';

type Props = {
  currentPage: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  isListView?: boolean;
};

export default function CursorPaginationComponent({
  currentPage,
  hasPrevPage,
  hasNextPage,
  onPrev,
  onNext,
  isListView,
}: Props) {
  return (
    <Pagination
      className={cn('py-spacing-4xl', isListView && 'px-spacing-4xl border-t')}
    >
      <PaginationContent className="justify-between w-full">
        <PaginationItem>
          <PaginationPrevious
            className={cn(
              'border border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary',
              !hasPrevPage && 'opacity-50 pointer-events-none',
            )}
            onClick={() => hasPrevPage && onPrev?.()}
          />
        </PaginationItem>

        <span className="text-label-sm text-text-gray-tertiary">
          Page {currentPage + 1}
        </span>

        <PaginationItem>
          <PaginationNext
            className={cn(
              'border border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary',
              !hasNextPage && 'opacity-50 pointer-events-none',
            )}
            onClick={() => hasNextPage && onNext?.()}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
