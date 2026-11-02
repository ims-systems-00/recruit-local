'use client';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';
import TrainingItem from './training-item';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CreateEditTrainingForm from './create-edit-training-form';
import TrainingSkeleton from './training-skeleton';
import EmptyBox from '@/components/empty-box';
import { TrainingData, useInfiniteTrainings } from '@/services/training';

const SCROLL_THRESHOLD = 80;

export default function Trainings({
  jobProfileId,
  isViewMode,
}: {
  isViewMode: boolean;
  jobProfileId: string;
}) {
  const [open, setOpen] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState<TrainingData | null>(
    null,
  );

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
    isError,
    refetch,
  } = useInfiniteTrainings(filters);

  const trainings = data?.pages.flatMap((page) => page.docs) ?? [];

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

  const onClearSelectedTraining = () => {
    setSelectedTraining(null);
  };

  const renderList = () => {
    if (isLoading) {
      return Array.from({ length: 3 }).map((_, index) => (
        <TrainingSkeleton key={index} />
      ));
    }

    if (isError) {
      return (
        <EmptyBox
          title="Trainings could not be loaded"
          description="Something went wrong while loading trainings. Please try again."
        >
          <Button
            variant="outline"
            onClick={() => refetch()}
            className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
          >
            Try again
          </Button>
        </EmptyBox>
      );
    }

    if (!trainings.length) {
      return (
        <EmptyBox
          title="No trainings added yet"
          description="Currently, there are no trainings added yet."
        >
          {!isViewMode && (
            <Button
              onClick={() => setOpen(true)}
              className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
            >
              <Plus />
              <span>Create New</span>
            </Button>
          )}
        </EmptyBox>
      );
    }

    return (
      <>
        {trainings.map((training) => (
          <TrainingItem
            key={training._id}
            training={training}
            onEdit={() => {
              setSelectedTraining(training);
              setOpen(true);
            }}
            isViewMode={isViewMode}
          />
        ))}
        {isFetchingNextPage && (
          <div className=" space-y-spacing-2xl">
            {Array.from({ length: 2 }).map((_, index) => (
              <TrainingSkeleton key={`loading-${index}`} />
            ))}
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="space-y-spacing-4xl">
        <div className=" flex flex-col sm:flex-row justify-between items-start sm:items-center gap-spacing-4xl py-spacing-xl">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Trainings
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
          className="space-y-spacing-2xl max-h-[calc(100vh-320px)] overflow-y-auto"
        >
          {renderList()}
        </div>
      </div>
      <Sheet
        open={open}
        onOpenChange={(open) => {
          if (!open) {
            onClearSelectedTraining();
          }
          setOpen(open);
        }}
      >
        <SheetContent className=" bg-white w-full sm:min-w-[400px] sm:max-w-[400px]">
          <SheetHeader className=" px-spacing-4xl pt-spacing-2xl pb-spacing-xs">
            <SheetTitle className=" text-label-lg! font-label-lg-strong! text-text-gray-primary">
              {selectedTraining?._id ? 'Edit Training' : 'Add New Trainings'}
            </SheetTitle>
          </SheetHeader>
          <div className=" px-spacing-4xl overflow-y-auto max-h-[calc(100vh-100px)]">
            <CreateEditTrainingForm
              setOpen={setOpen}
              defaultValues={selectedTraining || undefined}
              onClearSelectedTraining={onClearSelectedTraining}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
