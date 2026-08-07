'use client';

import {
  Bookmark,
  Facebook,
  Forward,
  Heart,
  Link2,
  Loader2,
} from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { useCreateReaction } from '@/services/reaction/reaction.client';
import { POST_TYPE_ENUMS, ReactionType } from '@rl/types';
import { useCreateFavourite } from '@/services/favourite';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export default function PostActions({
  postId,
  postType,
  alreadySaved,
  alreadyReacted,
  reactionCount,
}: {
  postId: string;
  postType: string;
  alreadySaved: boolean;
  alreadyReacted: string | null;
  reactionCount: number;
}) {
  const { createReaction, isPending: isCreatingReaction } = useCreateReaction();
  const { createFavourite, isPending: isCreatingFavourite } =
    useCreateFavourite();

  const getShareUrl = () => {
    const origin = window.location.origin;

    if (postType === POST_TYPE_ENUMS.ARTICLE) {
      return `${origin}/recruiter/news-feed/article/${postId}`;
    }

    return `${origin}/recruiter/news-feed`;
  };

  const openShareWindow = (shareLink: string) => {
    window.open(shareLink, '_blank', 'noopener,noreferrer');
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${url}`);
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(getShareUrl());
    openShareWindow(`https://api.whatsapp.com/send?text=${url}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

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
              {reactionCount}
            </p>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="cursor-pointer w-full flex items-center justify-center gap-spacing-2xs"
              >
                <Forward className="w-5 h-5 text-fg-gray-secondary" />
                <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
                  Share
                </p>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="w-44 bg-white">
              <DropdownMenuItem
                onClick={handleShareFacebook}
                className="gap-spacing-sm text-label-sm font-label-sm-strong! text-text-gray-secondary cursor-pointer"
              >
                <Facebook className="w-4 h-4" />
                Facebook
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleShareWhatsApp}
                className="gap-spacing-sm text-label-sm font-label-sm-strong! text-text-gray-secondary cursor-pointer"
              >
                <WhatsAppIcon className="w-4 h-4" />
                WhatsApp
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="gap-spacing-sm text-label-sm font-label-sm-strong! text-text-gray-secondary cursor-pointer"
              >
                <Link2 className="w-4 h-4" />
                Copy link
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
