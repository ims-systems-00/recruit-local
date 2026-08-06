import { Bookmark, Forward, Heart, Loader2 } from 'lucide-react';
import React from 'react';
import { useCreateReaction } from '@/services/reaction/reaction.client';
import { ReactionType } from '@rl/types';
import { useCreateFavourite } from '@/services/favourite';
import { cn } from '@/lib/utils';

export default function PostActions({
  postId,
  alreadySaved,
  alreadyReacted,
}: {
  postId: string;
  alreadySaved: boolean;
  alreadyReacted: string | null;
}) {
  console.log('alreadyReacted', alreadyReacted);

  const { createReaction, isPending: isCreatingReaction } = useCreateReaction();
  const { createFavourite, isPending: isCreatingFavourite } =
    useCreateFavourite();

  const onAddFavourite = async () => {
    await createFavourite({
      itemId: postId,
      itemType: 'posts',
    });
  };

  const handleCreateReaction = async () => {
    await createReaction({
      collectionName: 'posts',
      collectionId: postId,
      type: ReactionType.LOVE,
    });
  };
  return (
    <div className="space-y-spacing-lg border-t border-border-gray-secondary w-full">
      <div className="  py-spacing-2xl px-spacing-4xl ">
        <div className=" grid grid-cols-3 gap-spacing-2xl">
          <button
            onClick={handleCreateReaction}
            disabled={
              isCreatingReaction || alreadyReacted === ReactionType.LOVE
            }
            className=" cursor-pointer w-full flex items-center justify-center gap-spacing-2xs"
          >
            {isCreatingReaction ? (
              <Loader2 className="w-5 h-5 text-text-brand-primary animate-spin" />
            ) : (
              <Heart
                className={cn(
                  'w-5 h-5 text-text-brand-primary',
                  alreadyReacted === ReactionType.LOVE &&
                    'fill-text-brand-primary',
                )}
              />
            )}
            <p className="text-label-sm font-label-sm-strong! text-text-brand-primary">
              Like
            </p>
          </button>
          <div className=" w-full flex items-center justify-center gap-spacing-2xs">
            <Forward className="w-5 h-5 text-fg-gray-secondary" />
            <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
              Share
            </p>
          </div>
          <div className=" w-full flex items-center justify-center gap-spacing-2xs">
            <button
              onClick={onAddFavourite}
              disabled={isCreatingFavourite || alreadySaved}
              className=" cursor-pointer w-full flex items-center justify-center gap-spacing-2xs"
            >
              {isCreatingFavourite ? (
                <Loader2 className="w-5 h-5 text-fg-gray-secondary animate-spin" />
              ) : (
                <Bookmark
                  className={cn(
                    'w-5 h-5 text-fg-gray-secondary',
                    alreadySaved && 'fill-text-gray-secondary',
                  )}
                />
              )}
              <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
                {alreadySaved ? 'Saved' : 'Save'}
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
