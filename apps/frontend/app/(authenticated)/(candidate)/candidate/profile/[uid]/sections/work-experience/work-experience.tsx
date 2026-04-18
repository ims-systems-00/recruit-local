'use client';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import WorkExperienceItem from './work-experience-item';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CreateEditWorkExperienceForm from './create-edit-work-experience-form';
import { ExperienceData, useExperiences } from '@/services/experience';
import WorkExperienceSkeleton from './work-experience-skeleton';
import PaginationComponent from '../pagination-component';
import EmptyBox from '@/components/empty-box';

export default function WorkExperience() {
  const [open, setOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceData | null>(null);
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
    }),
    [page],
  );

  const { experiences, isLoading, pagination } = useExperiences(filters);

  const onClearSelectedExperience = () => {
    setSelectedExperience(null);
  };

  return (
    <>
      <div className="space-y-spacing-4xl">
        <div className=" flex justify-between items-center gap-spacing-4xl py-spacing-xl">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Work Experience
          </h4>

          <Button
            type="button"
            className="cursor-pointer h-10 rounded-lg bg-bg-brand-solid-primary text-white! text-label-sm font-label-sm-strong!"
            onClick={() => setOpen(true)}
          >
            <Plus className=" size-4" />
            Create
          </Button>
        </div>
        <div className=" space-y-spacing-2xl">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <WorkExperienceSkeleton key={index} />
            ))
          ) : Boolean(experiences?.length) ? (
            experiences?.map((experience) => (
              <WorkExperienceItem
                key={experience._id}
                experience={experience}
                onEdit={() => {
                  setSelectedExperience(experience);
                  setOpen(true);
                }}
              />
            ))
          ) : (
            <EmptyBox
              title="No experience added yet"
              description="Currently, there are no work experience added yet."
            >
              <Button
                disabled={isLoading}
                onClick={() => setOpen(true)}
                className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!"
              >
                <Plus />
                <span>Create New</span>
              </Button>
            </EmptyBox>
          )}
        </div>
        {Boolean(experiences?.length) && pagination?.totalPages && (
          <PaginationComponent
            meta={pagination}
            onPageChange={(pageNum) => {
              setPage(pageNum);
            }}
          />
        )}
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
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
