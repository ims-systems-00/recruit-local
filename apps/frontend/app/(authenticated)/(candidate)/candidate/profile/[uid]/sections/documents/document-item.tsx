import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  BriefcaseBusiness,
  CircleQuestionMark,
  EllipsisVertical,
  ImageIcon,
} from 'lucide-react';
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
import { toast } from 'sonner';
import { CvData } from '@/services/cv/cv.type';
import { useCvResumeUrls, useSoftDeleteCv } from '@/services/cv/cv.client';

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
};

/**
 * The CV's first page. CV files sit in private storage, so the preview is shown
 * through a short-lived signed URL; until one exists, the placeholder stays.
 */
function ResumePreview({
  thumbnailUrl,
  hasResume,
}: {
  thumbnailUrl?: string | null;
  hasResume: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (thumbnailUrl && !failed) {
    return (
      <div className="relative w-full h-48 overflow-hidden rounded-lg border border-border-gray-secondary bg-white">
        <Image
          src={thumbnailUrl}
          alt="CV preview"
          fill
          unoptimized
          className="object-cover object-top"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <>
      <div className=" w-7 h-7">
        <ImageIcon className="text-others-gray-default size-7" />
      </div>
      <p className="text-label-md font-label-md-strong! text-text-gray-secondary text-center">
        No Preview Available
      </p>
      <p className="text-body-xs text-text-gray-quaternary text-center">
        {hasResume
          ? 'The preview is not ready yet. Click to open the file.'
          : 'No preview available for this document. Please upload a document to preview it.'}
      </p>
    </>
  );
}

export default function DocumentItem({
  cv,
  onEdit,
  isViewMode,
}: {
  cv: CvData;
  onEdit: () => void;
  isViewMode: boolean;
}) {
  const [openDeleteAlertDialog, setOpenDeleteAlertDialog] = useState(false);
  const { softDeleteCv, isLoading } = useSoftDeleteCv();

  const resumeName = cv?.resume?.storageInformation?.Name || 'N/A';
  const hasResume = !!cv?.resume?.storageInformation?.Key;

  // Links are signed by the CV's own endpoint, which checks the viewer may
  // read this CV.
  const { resumeUrls, refetch: refetchResumeUrls } = useCvResumeUrls(
    cv._id,
    hasResume,
  );

  const openResume = async () => {
    // Opened before the await: Safari blocks a tab opened after one.
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;

    // Fetched fresh, so a page left open past the links' expiry still works.
    const { data, error } = await refetchResumeUrls();
    if (data?.url && tab) {
      tab.location.href = data.url;
    } else {
      tab?.close();
      toast.error(error?.message || 'Could not open the CV');
    }
  };

  return (
    <>
      <div className="bg-bg-gray-soft-primary rounded-2xl border border-border-gray-secondary shadow-xs p-spacing-4xl">
        <div className=" flex justify-between items-start gap-spacing-4xl">
          <div className=" flex gap-spacing-2xl">
            <div className=" space-y-spacing-3xs">
              <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                {resumeName}
              </p>
              <p className="text-label-sm text-text-gray-tertiary">
                Updated{' '}
                {cv?.updatedAt ? formatDate(new Date(cv?.updatedAt)) : 'N/A'}
              </p>
            </div>
          </div>
          {!isViewMode && (
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
          )}
        </div>
        {hasResume ? (
          <button
            type="button"
            onClick={openResume}
            aria-label={`Open ${resumeName}`}
            className="w-full p-spacing-4xl flex justify-center items-center flex-col gap-spacing-2xs cursor-pointer"
          >
            <ResumePreview thumbnailUrl={resumeUrls?.thumbnailUrl} hasResume />
          </button>
        ) : (
          <div className="p-spacing-4xl flex justify-center items-center flex-col gap-spacing-2xs">
            <ResumePreview hasResume={false} />
          </div>
        )}
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
              onClick={() => softDeleteCv(cv._id)}
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
