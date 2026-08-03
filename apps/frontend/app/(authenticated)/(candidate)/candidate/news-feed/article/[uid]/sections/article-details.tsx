'use client';
import DraftViewer from '@/components/draft-editor/draft-viewer';
import { PostData } from '@/services/post';
import Image from 'next/image';
import React from 'react';
import moment from 'moment';
import { Bookmark, Heart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactionType } from '@rl/types';
import { useCreateFavourite } from '@/services/favourite';
import { useCreateReaction } from '@/services/reaction/reaction.client';

export default function ArticleDetails({ item }: { item: PostData }) {
  const { createReaction, isPending: isCreatingReaction } = useCreateReaction();
  const { createFavourite, isPending: isCreatingFavourite } =
    useCreateFavourite();

  const onAddFavourite = async () => {
    await createFavourite({
      itemId: item._id,
      itemType: 'posts',
    });
  };

  const handleCreateReaction = async () => {
    await createReaction({
      collectionName: 'posts',
      collectionId: item._id,
      type: ReactionType.LOVE,
    });
  };
  return (
    <div className=" p-spacing-4xl space-y-spacing-4xl">
      <div className=" space-y-spacing-2xl">
        {item.banner?.src && (
          <div>
            <Image
              src={item.banner?.src || ''}
              alt={item.title}
              width={1920}
              height={384}
              className="w-full h-full max-h-96 rounded-2xl object-cover"
            />
          </div>
        )}

        <div className=" flex items-center justify-between gap-spacing-2xl">
          <div className="space-y-spacing-2xs">
            <div className=" flex items-center gap-spacing-sm ">
              <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
                {item.title}
              </p>
            </div>

            <div className=" flex items-center gap-spacing-sm text-text-gray-tertiary ">
              <p className="text-label-md text-text-gray-tertiary">
                {moment(item.createdAt).format('DD MMM YYYY h:mm a')}
              </p>

              <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
              <p className=" text-label-md text-text-gray-tertiary">
                By {item.creator?.name}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-spacing-sm min-w-[150px] justify-end">
            <Button
              variant="outline"
              size="sm"
              className=" border-0! shadow-none! cursor-pointer"
              onClick={handleCreateReaction}
              disabled={isCreatingReaction}
            >
              {isCreatingReaction ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Heart className="size-4" />
              )}
              100
            </Button>
            <Button
              variant="outline"
              size="sm"
              className=" h-10 w-10 min-w-10 cursor-pointer"
              onClick={onAddFavourite}
              disabled={isCreatingFavourite}
            >
              {isCreatingFavourite ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Bookmark className="size-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      <div>
        <DraftViewer content={item.text} />
      </div>
    </div>
  );
}
