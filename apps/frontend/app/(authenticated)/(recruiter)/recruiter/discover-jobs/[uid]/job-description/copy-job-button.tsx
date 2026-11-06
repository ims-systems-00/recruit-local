'use client';
import { Button } from '@/components/ui/button';
import { useDuplicateJob } from '@/services/jobs/jobs.client';
import { CopyPlus, Loader2 } from 'lucide-react';
import React from 'react';

/**
 * Copies this job into the recruiter's organisation as a draft and opens it in
 * the editor. What is copied is decided by the server.
 */
export default function CopyJobButton({ jobId }: { jobId: string }) {
  const { duplicateJob, isPending } = useDuplicateJob();

  return (
    <Button
      onClick={() => duplicateJob(jobId)}
      // Disabled while the copy is made, so a double click makes one draft, not two.
      disabled={isPending}
      className="cursor-pointer bg-bg-brand-solid-primary h-9 text-text-white! rounded-lg text-label-sm font-label-sm-strong!"
    >
      {isPending ? <Loader2 className="animate-spin" /> : <CopyPlus />}
      <span>Use this job</span>
    </Button>
  );
}
