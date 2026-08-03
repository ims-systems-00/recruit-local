import { EllipsisVertical, Heart } from 'lucide-react';
import Image from 'next/image';
import React, { useEffect } from 'react';
import SavesDefault from '@/public/images/saves_default.png';
import moment from 'moment';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import PostItemSkeleton from './post-item-skeleton';
import { useCallback, useState } from 'react';
import { useInfinitePosts } from '@/services/post';
import { POST_TYPE_ENUMS } from '@rl/types';
import PostItem from './post-item';

const SCROLL_THRESHOLD = 80;

export default function PostActivities({ carousel }: { carousel?: boolean }) {
  const [page, setPage] = useState(1);

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    data,
  } = useInfinitePosts({ page, type: POST_TYPE_ENUMS.POST });

  const posts = data?.pages.flatMap((page) => page.docs) ?? [];

  useEffect(() => {
    if (carousel) {
      setPage(1);
    }
  }, [carousel]);

  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;

      const distanceFromBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight;

      if (
        distanceFromBottom < SCROLL_THRESHOLD &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        fetchNextPage();
      }
    },
    [hasNextPage, isFetchingNextPage, fetchNextPage],
  );
  if (isLoading)
    return (
      <PostLayout>
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-2xl">
          {Array.from({ length: 3 }).map((_, index) => (
            <PostItemSkeleton key={`loading-${index}`} />
          ))}
        </div>
      </PostLayout>
    );
  if (carousel)
    return (
      <div>
        <Carousel className=" space-y-spacing-2xl">
          <h4 className=" text-text-gray-quaternary text-label-xl font-label-xl-strong!">
            Posts
          </h4>
          <CarouselContent>
            {posts.map((post) => (
              <CarouselItem
                key={post._id}
                className=" md:basis-1/2 lg:basis-1/3"
              >
                <PostItem
                  description={post.text}
                  creator={post.creator.name}
                  creatorImage={post.creator.profileImage?.src || ''}
                  creatorIndustry={post.creator.industry}
                  postedAt={post.createdAt}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          <CarouselPrevious className="cursor-pointer right-12 top-0 my-0 left-auto bg-bg-gray-soft-secondary border-border-gray-primary text-fg-gray-primary" />
          <CarouselNext className="cursor-pointer top-0 my-0 right-1 bg-bg-gray-soft-secondary border-border-gray-primary text-fg-gray-primary" />
        </Carousel>
      </div>
    );

  return (
    <PostLayout>
      <div
        className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-2xl"
        onScroll={handleScroll}
      >
        {posts.map((post) => (
          <PostItem
            key={post._id}
            description={post.text}
            creator={post.creator.name}
            creatorImage={post.creator.profileImage?.src || ''}
            creatorIndustry={post.creator.industry}
            postedAt={post.createdAt}
          />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, index) => (
            <PostItemSkeleton key={`loading-${index}`} />
          ))}
      </div>
    </PostLayout>
  );
}

const PostLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className=" space-y-spacing-2xl">
      <h4 className=" text-text-gray-quaternary text-label-xl font-label-xl-strong!">
        Posts
      </h4>
      {children}
    </div>
  );
};
