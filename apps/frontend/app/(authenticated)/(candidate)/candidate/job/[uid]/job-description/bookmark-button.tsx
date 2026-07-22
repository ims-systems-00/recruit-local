'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useCreateFavourite } from '@/services/favourite/favourite.client';
import { Bookmark } from 'lucide-react';
import React, { useState } from 'react';

export default function BookmarkButton({
  job_id,
  alreadySaved,
}: {
  job_id: string;
  alreadySaved: boolean;
}) {
  const [isSaved, setIsSaved] = useState(alreadySaved);

  const onSuccessCallback = () => {
    setIsSaved(true);
  };

  const { createFavourite, isPending } = useCreateFavourite(onSuccessCallback);
  const onAddFavourite = async () => {
    await createFavourite({
      itemId: job_id,
      itemType: 'jobs',
    });
  };
  return (
    <Button
      onClick={onAddFavourite}
      disabled={isPending || isSaved}
      className={cn(
        'cursor-pointer w-9! p-spacing-0! bg-bg-gray-soft-primary hover:bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!',
        isSaved &&
          'cursor-not-allowed text-text-brand-primary! border-border-brand-primary!',
      )}
    >
      <Bookmark />
    </Button>
  );
}
