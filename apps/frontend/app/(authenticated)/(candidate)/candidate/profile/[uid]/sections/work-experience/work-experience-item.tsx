import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CircleQuestionMark, EllipsisVertical } from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import DefaultImgForWorkExperience from '@/public/images/we_default.png';
import { ExperienceData, useSoftDeleteExperience } from '@/services/experience';
import { differenceInMonths } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

export default function WorkExperienceItem({
  experience,
  onEdit,
}: {
  experience: ExperienceData;
  onEdit: () => void;
}) {
  const [openDeleteAlertDialog, setOpenDeleteAlertDialog] = useState(false);
  const { softDeleteExperience, isPending } = useSoftDeleteExperience();

  return (
    <>
      <div className="bg-bg-gray-soft-primary rounded-2xl border border-border-gray-secondary shadow-xs p-spacing-4xl">
        <div className=" flex justify-between items-start gap-spacing-4xl">
          <div className=" flex gap-spacing-2xl">
            <div className=" min-w-12 max-w-12 ">
              <Image
                className="max-h-12 max-w-12 rounded-full"
                alt="Logo"
                src={DefaultImgForWorkExperience}
                width={48}
                height={48}
              />
            </div>
            <div className=" space-y-spacing-3xs">
              <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                {experience?.jobTitle || 'N/A'}
              </p>
              <div className="flex items-center gap-spacing-sm">
                <span className="text-label-sm text-text-gray-tertiary">
                  {experience?.company || 'N/A'}
                </span>
                <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

                <span className="text-label-sm text-text-gray-tertiary">
                  {experience?.employmentType || 'N/A'}
                </span>
              </div>
              <div className="flex items-center gap-spacing-sm">
                <span className="text-label-sm text-text-gray-tertiary">
                  {experience?.startDate
                    ? formatDate(new Date(experience?.startDate))
                    : 'N/A'}{' '}
                  -{' '}
                  {experience?.endDate
                    ? formatDate(new Date(experience?.endDate))
                    : 'Present'}
                </span>
                <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

                <span className="text-label-sm text-text-gray-tertiary">
                  {experience?.startDate
                    ? differenceInMonths(
                        new Date(experience?.endDate ?? new Date()),
                        new Date(experience.startDate),
                      )
                    : 'N/A'}{' '}
                  {experience?.startDate ? 'months' : ''}
                </span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="text-fg-gray-secondary flex items-center justify-center cursor-pointer">
                <EllipsisVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-32 bg-white">
              <DropdownMenuItem
                onClick={() => setOpenDeleteAlertDialog(true)}
                className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
              >
                Delete
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={onEdit}
                className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
              >
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                //   onClick={onUpdateJob}
                className=" text-label-sm font-label-sm-strong! text-text-gray-secondary"
              >
                Hide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <AlertDialog
        open={openDeleteAlertDialog}
        onOpenChange={setOpenDeleteAlertDialog}
      >
        <AlertDialogContent className="bg-white min-w-[400px] max-w-[400px]! rounded-3xl border border-others-brand-light gap-spacing-5xl">
          <AlertDialogHeader className=" gap-spacing-2xl">
            <div className=" flex justify-center items-center rounded-xl w-12 h-12 min-w-12 min-h-12 bg-others-brand-brand-zero border border-others-brand-light">
              <CircleQuestionMark className="text-others-brand-dark" />
            </div>
            <div className="space-y-spacing-3xs">
              <AlertDialogTitle className="text-label-lg font-label-lg-strong! text-text-gray-primary">
                Are You sure you want to delete?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-body-sm text-text-gray-tertiary">
                One you delete you can not retrieve
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-spacing-2xl">
            <AlertDialogCancel
              disabled={isPending}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => softDeleteExperience(experience._id)}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white bg-bg-brand-solid-primary"
            >
              {isPending ? 'Deleting...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
