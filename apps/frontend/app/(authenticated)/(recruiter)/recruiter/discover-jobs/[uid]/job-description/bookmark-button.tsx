'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCreateFavourite } from '@/services/favourite/favourite.client';
import { JobData } from '@/services/jobs/job.type';
import { Bookmark, Loader2 } from 'lucide-react';
import React from 'react';

export default function BookmarkButton({ jobData }: { jobData: JobData }) {
  const { createFavourite, isPending } = useCreateFavourite();
  const onAddFavourite = async () => {
    await createFavourite({
      itemId: jobData._id,
      itemType: 'jobs',
    });
  };
  console.log(jobData, 'jobData');
  return (
    <Button
      onClick={onAddFavourite}
      disabled={isPending || jobData.alreadySaved}
      className={cn(
        'cursor-pointer w-9! p-spacing-0! bg-bg-gray-soft-primary hover:bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!',
        jobData.alreadySaved &&
          'text-text-brand-primary! border-border-brand-primary! cursor-not-allowed',
      )}
    >
      {isPending ? <Loader2 className="animate-spin" /> : <Bookmark />}
    </Button>
  );
}
