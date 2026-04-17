'use client';
import { Button } from '@/components/ui/button';

import { Plus } from 'lucide-react';
import React, { useState } from 'react';
import WorkExperienceItem from './work-experience-item';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import CreateEditWorkExperienceForm from './create-edit-work-experience-form';
import { ExperienceData } from '@/services/experience';

export default function WorkExperience() {
  const [open, setOpen] = useState(false);
  const [selectedExperience, setSelectedExperience] =
    useState<ExperienceData | null>(null);
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
          <WorkExperienceItem />
          <WorkExperienceItem />
        </div>
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
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
