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

export type JobStatusChange = 'close' | 'publish';

const COPY: Record<
  JobStatusChange,
  { title: string; pending: string; status: JOBS_STATUS_ENUMS }
> = {
  close: {
    title: 'Are you sure you want to close this job post?',
    pending: 'Closing...',
    status: JOBS_STATUS_ENUMS.CLOSED,
  },
  publish: {
    title: 'Are you sure you want to publish this job post?',
    pending: 'Publishing...',
    status: JOBS_STATUS_ENUMS.OPEN,
  },
};

type JobStatusDialogProps = {
  jobId: string;
  change: JobStatusChange;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
};

export default function JobStatusDialog({
  jobId,
  change,
  open,
  onOpenChange,
  onSuccess,
}: JobStatusDialogProps) {
  const { updateJob, isPending } = useUpdateJob();
  const copy = COPY[change];

  // plain button so the dialog stays open while saving
  const onConfirm = () =>
    updateJob({
      id: jobId,
      data: { status: copy.status },
      onSuccessNext: () => {
        onOpenChange(false);
        onSuccess?.();
      },
    });

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent
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
            {copy.title}
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
            {isPending ? copy.pending : 'Yes, Confirm'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
