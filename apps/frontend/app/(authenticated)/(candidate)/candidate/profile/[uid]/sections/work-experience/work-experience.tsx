'use client';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import WorkExperienceItem from './work-experience-item';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CreateEditWorkExperienceForm from './create-edit-work-experience-form';
import { ExperienceData, useInfiniteExperiences } from '@/services/experience';
import WorkExperienceSkeleton from './work-experience-skeleton';
import EmptyBox from '@/components/empty-box';

const SCROLL_THRESHOLD = 80;

export default function WorkExperience({
  jobProfileId,
  isViewMode,
}: {
  jobProfileId: string;
  isViewMode: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceData | null>(null);

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
  } = useInfiniteExperiences(filters);

  const experiences = data?.pages.flatMap((page) => page.docs) ?? [];

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

  const onClearSelectedExperience = () => {
    setSelectedExperience(null);
  };

  return (
    <>
      <div className="space-y-spacing-4xl">
        <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-spacing-4xl py-spacing-xl">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Work Experience
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
                <WorkExperienceSkeleton key={index} />
              ))
            ) : Boolean(experiences?.length) ? (
              <>
                {experiences?.map((experience) => (
                  <WorkExperienceItem
                    key={experience._id}
                    experience={experience}
                    onEdit={() => {
                      setSelectedExperience(experience);
                      setOpen(true);
                    }}
                    isViewMode={isViewMode}
                  />
                ))}
                {isFetchingNextPage && (
                  <div className=" space-y-spacing-2xl">
                    {Array.from({ length: 2 }).map((_, index) => (
                      <WorkExperienceSkeleton key={`loading-${index}`} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <EmptyBox
                title="No experience added yet"
                description="Currently, there are no work experience added yet."
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
            onClearSelectedExperience();
          }
          setOpen(open);
        }}
      >
        <SheetContent className=" bg-white min-w-[400px] max-w-[400px]">
          <SheetHeader className=" px-spacing-4xl pt-spacing-2xl pb-spacing-xs">
            <SheetTitle className=" text-label-lg! font-label-lg-strong! text-text-gray-primary">
              {selectedExperience?._id
                ? 'Edit Work Experience'
                : 'Add New Work Experience'}
            </SheetTitle>
          </SheetHeader>
          <div className=" px-spacing-4xl overflow-y-auto max-h-[calc(100vh-100px)]">
            <CreateEditWorkExperienceForm
              setOpen={setOpen}
              defaultValues={selectedExperience || undefined}
              onClearSelectedExperience={onClearSelectedExperience}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
