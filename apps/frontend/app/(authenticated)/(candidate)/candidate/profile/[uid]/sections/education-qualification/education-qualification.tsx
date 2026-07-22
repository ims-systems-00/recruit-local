'use client';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import EducationQualificationItem from './education-qualification-item';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CreateEditEducationQualificationForm from './create-edit-education-qualification-form';
import EducationQualificationSkeleton from './education-qualification-skeleton';
import PaginationComponent from '../pagination-component';
import EmptyBox from '@/components/empty-box';
import { EducationData, useEducations } from '@/services/education';

export default function EducationQualification() {
  const [open, setOpen] = useState(false);
  const [selectedEducation, setSelectedEducation] =
    useState<EducationData | null>(null);
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      page,
      limit: 10,
    }),
    [page],
  );

  const {
    educations: educationQualifications,
    isLoading,
    pagination,
  } = useEducations(filters);

  const onClearSelectedEducation = () => {
    setSelectedEducation(null);
  };

  return (
    <>
      <div className="space-y-spacing-4xl">
        <div className=" flex justify-between items-center gap-spacing-4xl py-spacing-xl">
          <h4 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            Education Qualification
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
              <EducationQualificationSkeleton key={index} />
            ))
          ) : Boolean(educationQualifications?.length) ? (
            educationQualifications?.map((education) => (
              <EducationQualificationItem
                key={education._id}
                education={education}
                onEdit={() => {
                  setSelectedEducation(education);
                  setOpen(true);
                }}
              />
            ))
          ) : (
            <EmptyBox
              title="No education qualifications added yet"
              description="Currently, there are no education qualifications added yet."
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
        {Boolean(educationQualifications?.length) && pagination?.totalPages && (
          <PaginationComponent
            meta={pagination}
            onPageChange={(pageNum) => {
              setPage(pageNum);
            }}
          />
        )}
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
