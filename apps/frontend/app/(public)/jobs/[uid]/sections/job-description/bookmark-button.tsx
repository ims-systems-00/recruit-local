'use client';
import { Button } from '@/components/ui/button';
import { useCreateFavourite } from '@/services/favourite/favourite.client';
import { Bookmark } from 'lucide-react';
import React from 'react';

export default function BookmarkButton({ job_id }: { job_id: string }) {
  const { createFavourite, isPending } = useCreateFavourite();
  const onAddFavourite = async () => {
    await createFavourite({
      itemId: job_id,
      itemType: 'jobs',
    });
  };
  return (
    <Button
      onClick={onAddFavourite}
      disabled={isPending}
      className="cursor-pointer w-9! p-spacing-0! bg-bg-gray-soft-primary hover:bg-bg-gray-soft-primary border border-border-gray-primary h-9 text-text-gray-secondary! rounded-lg text-label-sm font-label-sm-strong!"
    >
      <Bookmark />
    </Button>
  );
}
