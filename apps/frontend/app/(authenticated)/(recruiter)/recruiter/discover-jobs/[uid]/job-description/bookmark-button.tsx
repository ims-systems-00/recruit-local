'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  useCreateFavourite,
  useSoftDeleteFavourite,
} from '@/services/favourite/favourite.client';
import { JobData } from '@/services/jobs/job.type';
import { Bookmark, Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export default function BookmarkButton({ jobData }: { jobData: JobData }) {
  const [alreadySavedId, setAlreadySavedId] = useState(jobData?.alreadySavedId);
  const [alreadySaved, setAlreadySaved] = useState(jobData?.alreadySaved);

  const { createFavourite, isPending } = useCreateFavourite((data) => {
    setAlreadySavedId(data._id);
    setAlreadySaved(true);
  });

  const { softDeleteFavourite, isPending: isSoftDeletingFavourite } =
    useSoftDeleteFavourite((data) => {
      setAlreadySavedId(null);
      setAlreadySaved(false);
    });
  const onToggleFavourite = async () => {
    if (alreadySavedId) {
      await softDeleteFavourite(alreadySavedId);
    } else {
      await createFavourite({
        itemId: jobData._id,
        itemType: 'jobs',
      });
    }
  };

  useEffect(() => {
    setAlreadySavedId(jobData?.alreadySavedId);
    setAlreadySaved(jobData?.alreadySaved);
  }, [jobData]);

  return (
    <Button
      onClick={onToggleFavourite}
      disabled={isPending || isSoftDeletingFavourite}
      className={cn(
        'cursor-pointer w-9! p-spacing-0! bg-bg-gray-soft-primary hover:bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!',
        alreadySaved && 'text-text-brand-primary! border-border-brand-primary!',
      )}
    >
      {isPending || isSoftDeletingFavourite ? (
        <Loader2 className="animate-spin" />
      ) : (
        <Bookmark />
      )}
    </Button>
  );
}
