import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CircleQuestionMark,
  EllipsisVertical,
  GraduationCap,
} from 'lucide-react';
import Image from 'next/image';
import React, { useState } from 'react';
import DefaultImgForEducation from '@/public/images/ed_default.png';
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
import { EducationData, useSoftDeleteEducation } from '@/services/education';

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

export default function WorkExperienceItem({
  education,
  onEdit,
}: {
  education: EducationData;
  onEdit: () => void;
}) {
  const [openDeleteAlertDialog, setOpenDeleteAlertDialog] = useState(false);
  const { softDeleteEducation, isLoading } = useSoftDeleteEducation();

  return (
    <>
      <div className="bg-bg-gray-soft-primary rounded-2xl border border-border-gray-secondary shadow-xs p-spacing-4xl">
        <div className=" flex justify-between items-start gap-spacing-4xl">
          <div className=" flex gap-spacing-2xl">
            <div className=" min-w-12 max-w-12 ">
              <div className="max-h-12 max-w-12 w-12 bg-others-gray-gray-zero h-12 rounded-full flex items-center justify-center border border-others-gray-xlight">
                <GraduationCap className="text-others-gray-default size-7" />
              </div>
              {/* <Image
                className="max-h-12 max-w-12"
                alt="Logo"
                src={DefaultImgForEducation}
                width={48}
                height={48}
              /> */}
            </div>
            <div className=" space-y-spacing-3xs">
              <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                {education?.degree || 'N/A'} of{' '}
                {education?.fieldOfStudy || 'N/A'}
              </p>
              <div className="flex items-center gap-spacing-sm">
                <span className="text-label-sm text-text-gray-tertiary">
                  {education?.institution || 'N/A'}
                </span>
                <div className=" w-1.5 h-1.5 bg-fg-gray-tertiary rounded-full"></div>

                <span className="text-label-sm text-text-gray-tertiary">
                  {education?.startDate
                    ? formatDate(new Date(education?.startDate))
                    : 'N/A'}{' '}
                  -{' '}
                  {education?.endDate
                    ? formatDate(new Date(education?.endDate))
                    : 'Present'}
                </span>
              </div>
              <p className="text-label-sm text-text-gray-tertiary">
                GPA: {education?.grade || 'N/A'}
              </p>
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
              disabled={isLoading}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-secondary"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isLoading}
              onClick={() => softDeleteEducation(education._id)}
              className=" cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white bg-bg-brand-solid-primary"
            >
              {isLoading ? 'Deleting...' : 'Yes, Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
