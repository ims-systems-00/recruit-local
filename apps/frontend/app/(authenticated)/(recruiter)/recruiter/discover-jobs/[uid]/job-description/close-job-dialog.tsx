'use client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { useUpdateJob } from '@/services/jobs/jobs.client';
import { JOBS_STATUS_ENUMS } from '@rl/types';
import { CircleQuestionMark, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type CloseJobDialogProps = {
  jobId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Asks before closing one of the recruiter's own open jobs. A closed job leaves
 * Discover, so on success this opens the recruiter's own page for the job.
 */
export default function CloseJobDialog({
  jobId,
  open,
  onOpenChange,
}: CloseJobDialogProps) {
  const router = useRouter();
  const { updateJob, isPending } = useUpdateJob();

  // A plain button, not AlertDialogAction (which closes at once), so the dialog
  // stays open until the redirect, or after a failure to retry or discard.
  const onConfirm = () =>
    updateJob({
      id: jobId,
      data: { status: JOBS_STATUS_ENUMS.CLOSED },
      onSuccessNext: () => router.push(`/recruiter/job/${jobId}`),
    });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
        // The design has a title only; this tells Radix no description is intended.
        aria-describedby={undefined}
        className="bg-white min-w-[400px] max-w-[400px]! rounded-3xl border border-others-brand-light gap-spacing-5xl"
      >
        <AlertDialogCancel
          variant="ghost"
          size="icon"
          aria-label="Close"
          disabled={isPending}
          className="absolute top-4 right-4 cursor-pointer text-fg-gray-secondary"
        >
          <X />
        </AlertDialogCancel>
        <AlertDialogHeader className="gap-spacing-2xl">
          <div className="flex justify-center items-center rounded-xl w-12 h-12 min-w-12 min-h-12 bg-others-brand-brand-zero border border-others-brand-light">
            <CircleQuestionMark className="text-others-brand-dark" />
          </div>
          <AlertDialogTitle className="text-label-lg font-label-lg-strong! text-text-gray-primary">
            Are you sure you want to close this job post?
          </AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-spacing-2xl">
          <AlertDialogCancel
            disabled={isPending}
            className="cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-secondary"
          >
            Discard
          </AlertDialogCancel>
          <Button
            disabled={isPending}
            onClick={onConfirm}
            className="cursor-pointer flex-1 h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-white bg-bg-brand-solid-primary"
          >
            {isPending ? 'Closing...' : 'Yes, Confirm'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
