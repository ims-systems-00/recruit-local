'use client';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import ArticleItem from './article-item';
import { useCallback, useState } from 'react';
import { useInfinitePosts } from '@/services/post';
import ArticleItemSkeleton from './article-item-skeleton';
import { POST_TYPE_ENUMS } from '@rl/types';

type ArticleActivitiesProps = {
  carousel?: boolean;
};

const SCROLL_THRESHOLD = 80;

export default function ArticleActivities({
  carousel,
}: ArticleActivitiesProps) {
  const [page, setPage] = useState(1);

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    data,
  } = useInfinitePosts({ page, type: POST_TYPE_ENUMS.ARTICLE });

  const posts = data?.pages.flatMap((page) => page.docs) ?? [];

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
      <ArticleLayout>
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-2xl">
          {Array.from({ length: 3 }).map((_, index) => (
            <ArticleItemSkeleton key={`loading-${index}`} />
          ))}
        </div>
      </ArticleLayout>
    );
  if (carousel)
    return (
      <div>
        <Carousel className=" space-y-spacing-2xl">
          <h4 className=" text-text-gray-quaternary text-label-xl font-label-xl-strong!">
            Articles
          </h4>
          <CarouselContent>
            {posts.map((post) => (
              <CarouselItem
                key={post._id}
                className=" md:basis-1/2 lg:basis-1/3"
              >
                <ArticleItem
                  title={post.title}
                  image={post.banner?.src || ''}
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
    <ArticleLayout>
      <div
        className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-2xl"
        onScroll={handleScroll}
      >
        {posts.map((post) => (
          <ArticleItem
            key={post._id}
            title={post.title}
            image={post.banner?.src || ''}
            postedAt={post.createdAt}
          />
        ))}
        {isFetchingNextPage &&
          Array.from({ length: 3 }).map((_, index) => (
            <ArticleItemSkeleton key={`loading-${index}`} />
          ))}
      </div>
    </ArticleLayout>
  );
}

const ArticleLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className=" space-y-spacing-2xl">
      <h4 className=" text-text-gray-quaternary text-label-xl font-label-xl-strong!">
        Articles
      </h4>
      {children}
    </div>
  );
};
