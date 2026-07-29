'use client';
import React, { useState } from 'react';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import SavesDefault from '@/public/images/saves_default.png';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { EllipsisVertical, Heart, Search } from 'lucide-react';
import Image from 'next/image';
import NewsFeedPost from './news-feed-post';
import { usePosts } from '@/services/post';
import { useDebounce } from '@/hooks/useDebounce';
import PostSkelaton from './post-skelaton';
import moment from 'moment';
import PostActions from './post-actions';
import ArticleItem from './article-item';
import { POST_TYPE_ENUMS } from '@rl/types';

export default function Posts() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const { posts, isLoading } = usePosts({ clientSearch: debouncedSearch });

  return (
    <div className=" p-spacing-4xl space-y-spacing-4xl">
      <div className=" flex justify-between items-center gap-spacing-2xl">
        <div className=" space-y-spacing-2xs">
          <h3 className=" text-body-lg font-body-lg-strong! text-text-gray-primary">
            Good Morning, BootTech
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

      <div className="space-y-spacing-4xl max-h-[calc(100vh-166px)] overflow-y-auto">
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
              <Image
                className="max-h-12 max-w-12 w-12 h-12 rounded-full "
                alt="Logo"
                src={RecruitDefaultLogo}
                width={48}
                height={48}
              />
            </div>
            <NewsFeedPost />
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
                <ArticleItem createdAt={post.createdAt} title={post.title} />
              ) : (
                <div className="p-spacing-4xl space-y-spacing-4xl w-full">
                  <div className=" flex justify-between gap-spacing-lg items-start w-full">
                    <div className="flex items-center gap-spacing-lg">
                      <div>
                        <Image
                          className="max-h-10 h-10 w-10 rounded-full"
                          alt="AchievementsDefault"
                          src={SavesDefault}
                          height={40}
                          width={40}
                        />
                      </div>
                      <div className="space-y-spacing-2xs">
                        <div className=" flex items-center gap-spacing-sm ">
                          <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                            {post.title}
                          </p>
                        </div>

                        <div className=" flex items-center gap-spacing-sm text-text-gray-tertiary ">
                          <p className=" text-label-sm text-text-gray-tertiary">
                            IT Company
                          </p>
                          <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
                          <p className="text-label-sm text-text-gray-tertiary">
                            {moment(post.createdAt).format(
                              'DD MMM YYYY h:mm a',
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className=" min-w-5 inline-block">
                      <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
                    </span>
                  </div>

                  <div>
                    <p>{post.text}</p>
                  </div>
                  <div className=" w-fit flex gap-spacing-2xs justify-center items-center rounded-full px-spacing-sm py-spacing-3xs bg-bg-gray-soft-secondary border border-border-gray-secondary text-label-sm font-label-sm-strong!  text-text-gray-secondary">
                    <Heart className="w-4 h-4 text-text-brand-primary" />
                    <span>100</span>
                  </div>
                </div>
              )}

              <PostActions />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
