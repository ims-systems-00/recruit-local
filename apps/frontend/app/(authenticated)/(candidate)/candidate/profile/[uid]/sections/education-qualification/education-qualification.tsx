'use client';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import EducationQualificationItem from './education-qualification-item';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CreateEditEducationQualificationForm from './create-edit-education-qualification-form';
import EducationQualificationSkeleton from './education-qualification-skeleton';
import EmptyBox from '@/components/empty-box';
import { EducationData, useInfiniteEducations } from '@/services/education';

const SCROLL_THRESHOLD = 80;

export default function EducationQualification({
  jobProfileId,
  isViewMode,
}: {
  isViewMode: boolean;
  jobProfileId: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] =
    useState<EducationData | null>(null);

  const filters = useMemo(
    () => ({
      jobProfileId,
      limit: 10,
    }),
    [jobProfileId],
  );

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteEducations(filters);

  const educationQualifications =
    data?.pages.flatMap((page) => page.docs) ?? [];

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

  const onClearSelectedEducation = () => {
    setSelectedEducation(null);
  };

  return (
    <>
      <div className="space-y-spacing-4xl">
        <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-spacing-4xl py-spacing-xl">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Education Qualification
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
        <div className=" space-y-spacing-2xl">
          <div
            onScroll={handleScroll}
            className="space-y-spacing-2xl max-h-[calc(100vh-320px)] overflow-y-auto"
          >
            {isLoading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <EducationQualificationSkeleton key={index} />
              ))
            ) : Boolean(educationQualifications?.length) ? (
              <>
                {educationQualifications?.map((education) => (
                  <EducationQualificationItem
                    key={education._id}
                    education={education}
                    onEdit={() => {
                      setSelectedEducation(education);
                      setOpen(true);
                    }}
                    isViewMode={isViewMode}
                  />
                ))}
                {isFetchingNextPage && (
                  <div className=" space-y-spacing-2xl">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <EducationQualificationSkeleton
                        key={`loading-${index}`}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyBox
                title="No education qualifications added yet"
                description="Currently, there are no education qualifications added yet."
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
      </div>
      <Sheet
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            onClearSelectedEducation();
          }
          setOpen(open);
        }}
      >
        <SheetContent className=" bg-white min-w-[400px] max-w-[400px]">
          <SheetHeader className=" px-spacing-4xl pt-spacing-2xl pb-spacing-xs">
            <SheetTitle className=" text-label-lg! font-label-lg-strong! text-text-gray-primary">
              {selectedEducation?._id
                ? 'Edit Education Qualifications'
                : 'Add New Education Qualifications'}
            </SheetTitle>
          </SheetHeader>
          <div className=" px-spacing-4xl overflow-y-auto max-h-[calc(100vh-100px)]">
            <CreateEditEducationQualificationForm
              setOpen={setOpen}
              defaultValues={selectedEducation || undefined}
              onClearSelectedEducation={onClearSelectedEducation}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
