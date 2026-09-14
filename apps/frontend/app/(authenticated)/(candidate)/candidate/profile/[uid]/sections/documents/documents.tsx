'use client';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import DocumentItem from './document-item';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import DocumentsSkeleton from './documents-skeleton';
import EmptyBox from '@/components/empty-box';
import CreateEditDocumentForm from './create-edit-documen-form';
import { CvData } from '@/services/cv/cv.type';
import { useInfiniteCvs } from '@/services/cv/cv.client';

const SCROLL_THRESHOLD = 80;

export default function Documents({
  jobProfileId,
  isViewMode,
}: {
  jobProfileId: string;
  isViewMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedCv, setSelectedCv] = useState<CvData | null>(null);

  const filters = useMemo(
    () => ({
      jobProfileId,
      limit: 9,
    }),
    [jobProfileId],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteCvs(filters);

  const cvs = data?.pages.flatMap((page) => page.docs) ?? [];

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

  const onClearSelectedCv = () => {
    setSelectedCv(null);
  };

  return (
    <>
      <div className="space-y-spacing-4xl">
        <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-spacing-4xl py-spacing-xl">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Documents
          </h4>

          {!isViewMode && (
            <Button
              type="button"
              className="cursor-pointer h-10 rounded-lg bg-bg-brand-solid-primary text-white! text-label-sm font-label-sm-strong!"
              onClick={() => setOpen(true)}
            >
              <Plus className=" size-4" />
              Create
            </Button>
          )}
        </div>
        <div
          onScroll={handleScroll}
          className="max-h-[calc(100vh-320px)] overflow-y-auto space-y-spacing-2xl"
        >
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <DocumentsSkeleton key={index} />
            ))
          ) : Boolean(cvs?.length) ? (
            <>
              <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
                {cvs?.map((cv) => (
                  <DocumentItem
                    key={cv._id}
                    cv={cv}
                    onEdit={() => {
                      setSelectedCv(cv);
                      setOpen(true);
                    }}
                    isViewMode={isViewMode}
                  />
                ))}
              </div>
              {isFetchingNextPage && (
                <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
                  {Array.from({ length: 2 }).map((_, index) => (
                    <DocumentsSkeleton key={`loading-${index}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <EmptyBox
              title="No documents added yet"
              description="Currently, there are no documents added yet."
            >
              {!isViewMode && (
                <Button
                  disabled={isLoading}
                  onClick={() => setOpen(true)}
                  className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
                >
                  <Plus />
                  <span>Create New</span>
                </Button>
              )}
            </EmptyBox>
          )}
        </div>
      </div>
      <Sheet
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            onClearSelectedCv();
          }
          setOpen(open);
        }}
      >
        <SheetContent className=" bg-white min-w-[400px] max-w-[400px]">
          <SheetHeader className=" px-spacing-4xl pt-spacing-2xl pb-spacing-xs">
            <SheetTitle className=" text-label-lg! font-label-lg-strong! text-text-gray-primary">
              {selectedCv?._id ? 'Edit Documents' : 'Add New Documents'}
            </SheetTitle>
          </SheetHeader>
          <div className=" px-spacing-4xl overflow-y-auto max-h-[calc(100vh-100px)]">
            <CreateEditDocumentForm
              setOpen={setOpen}
              defaultValues={selectedCv || undefined}
              onClearSelectedCv={onClearSelectedCv}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
