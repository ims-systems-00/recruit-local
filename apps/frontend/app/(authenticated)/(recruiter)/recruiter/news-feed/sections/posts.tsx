'use client';
import React, { useCallback, useState } from 'react';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Search } from 'lucide-react';
import Image from 'next/image';
import NewsFeedPost from './news-feed-post';
import { useInfinitePosts, usePosts } from '@/services/post';
import { useDebounce } from '@/hooks/useDebounce';
import PostSkelaton from './post-skelaton';
import PostActions from './post-actions';
import ArticleItem from './article-item';
import { POST_TYPE_ENUMS } from '@rl/types';
import PostItem from './post-item';
import { useTenant } from '@/services/tenants/tenants.client';
import { useSession } from 'next-auth/react';
import { Skeleton } from '@/components/ui/skeleton';
import { TenantData } from '@/services/tenants/tenants.type';

const SCROLL_THRESHOLD = 80;

export default function Posts() {
  const { data: session } = useSession();

  const user = session?.user;
  const tenantId = user?.tenantId;
  const { tenant, isLoading: isTenantLoading } = useTenant(
    tenantId,
    !!tenantId,
  );
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [page, setPage] = useState(1);

  const {
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    data,
  } = useInfinitePosts({ clientSearch: debouncedSearch, page });

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

  return (
    <div className=" p-spacing-4xl space-y-spacing-4xl">
      <div className=" flex justify-between items-center gap-spacing-2xl">
        <div className=" space-y-spacing-2xs">
          <h3 className=" text-body-lg font-body-lg-strong! text-text-gray-primary">
            Good Morning,{' '}
            {isTenantLoading ? (
              <Skeleton className="w-20 h-4 inline-flex" />
            ) : (
              tenant?.name
            )}
          </h3>
          <p className=" capitalize text-label-sm text-text-gray-tertiary">
            Share updates, find talent, and stay informed with Recruit Local.
          </p>
        </div>
        <InputGroup className=" max-w-[400px] h-10 rounded-lg shadow-xs border-border-gray-primary">
          <InputGroupInput
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <InputGroupAddon>
            <Search className=" text-fg-gray-tertiary" />
          </InputGroupAddon>
        </InputGroup>
      </div>

      <div
        onScroll={handleScroll}
        className="space-y-spacing-4xl max-h-[calc(100vh-166px)] overflow-y-auto"
      >
        <div className=" p-spacing-2xl border border-border-gray-secondary rounded-2xl space-y-spacing-4xl">
          <div className=" space-y-spacing-xs">
            <p className=" text-label-md font-label-md-strong! text-text-gray-secondary">
              Start your post
            </p>
            <p className=" text-label-sm text-text-gray-tertiary">
              Tell the community what’s happening today!
            </p>
          </div>
          <div className=" flex gap-spacing-lg">
            <div className=" min-w-12">
              {isTenantLoading ? (
                <Skeleton className="max-h-12 max-w-12 w-12 h-12 rounded-full" />
              ) : (
                <Image
                  className="max-h-12 max-w-12 w-12 h-12 rounded-full "
                  alt="Logo"
                  src={tenant?.profileImage?.src || RecruitDefaultLogo}
                  width={48}
                  height={48}
                />
              )}
            </div>
            <NewsFeedPost tenant={tenant as TenantData} />
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-spacing-4xl">
            {Array.from({ length: 5 }).map((_, index) => (
              <PostSkelaton key={index} />
            ))}
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post._id}
              className=" rounded-2xl border border-border-gray-secondary flex flex-col items-center"
            >
              {post.type === POST_TYPE_ENUMS.ARTICLE ? (
                <ArticleItem
                  uid={post._id}
                  createdAt={post.createdAt}
                  title={post.title}
                  banner={post.banner?.src}
                  creator={post.creator}
                />
              ) : (
                <PostItem
                  createdAt={post.createdAt}
                  title={post.title}
                  text={post.text}
                  images={post.images}
                  creator={post.creator}
                />
              )}

              <PostActions postId={post._id} />
            </div>
          ))
        )}

        {isFetchingNextPage && (
          <div className=" space-y-spacing-4xl">
            {Array.from({ length: 2 }).map((_, index) => (
              <PostSkelaton key={`loading-${index}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
