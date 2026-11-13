'use client';
import { useState } from 'react';
import { toast } from 'sonner';
import { JobData } from '@/services/jobs/job.type';
import JobStatusDialog, {
  JobStatusChange,
} from '@/components/job-status-dialog';
import { isJobExpired } from './job-status';

export function useJobStatusChange(job: Pick<JobData, '_id' | 'endDate'>) {
  const [change, setChange] = useState<JobStatusChange | null>(null);

  const requestChange = (next: JobStatusChange) => {
    if (next === 'publish' && isJobExpired(job)) {
      toast.error("This job's end date has passed, so it can't be published.");
      return;
    }
    setChange(next);
  };

  const dialog = change && (
    <JobStatusDialog
      jobId={job._id}
      change={change}
      open
      onOpenChange={(open) => !open && setChange(null)}
    />
  );

  return { requestChange, dialog };
}
