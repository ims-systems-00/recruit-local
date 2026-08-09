import React from 'react';
import Image from 'next/image';
import SavesDefault from '@/public/images/saves_default.png';
import moment from 'moment';
import { EllipsisVertical, Heart } from 'lucide-react';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import Link from 'next/link';
import { Creator } from '@/services/post/post.type';

export default function ArticleItem({
  uid,
  createdAt,
  title,
  banner,
  creator,
  reactionCount,
}: {
  uid: string;
  createdAt: string;
  title: string;
  creator: Creator;
  banner?: string;
  reactionCount: number;
}) {
  return (
    <div className="p-spacing-4xl space-y-spacing-4xl w-full">
      <div className=" flex justify-between gap-spacing-lg items-start w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-spacing-lg">
          <div>
            <Image
              className="max-h-10 h-10 w-10 rounded-full"
              alt="AchievementsDefault"
              src={creator?.profileImage?.src || SavesDefault}
              height={40}
              width={40}
            />
          </div>
          <div className="space-y-spacing-2xs">
            <div className=" flex items-center gap-spacing-sm ">
              <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                {creator.name}
              </p>
            </div>

            <div className=" flex items-center gap-spacing-sm text-text-gray-tertiary ">
              <p className=" text-label-sm text-text-gray-tertiary capitalize">
                {creator.industry}
              </p>
              <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
              <p className="text-label-sm text-text-gray-tertiary">
                {moment(createdAt).format('DD MMM YYYY h:mm a')}
              </p>
            </div>
          </div>
        </div>
        <span className=" min-w-5 inline-block">
          <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
        </span>
      </div>

      <div className="space-y-spacing-4xl">
        <Image
          src={banner || RecruitProfileDefault}
          alt={title}
          width={1920}
          height={298}
          className="rounded-xl max-h-[298px] w-full object-cover"
        />
        <Link
          href={`/recruiter/news-feed/article/${uid}`}
          className=" text-heading-sm text-text-gray-primary"
        >
          {' '}
          {title}
        </Link>
      </div>
      <div className=" w-fit flex gap-spacing-2xs justify-center items-center rounded-full px-spacing-sm py-spacing-3xs bg-bg-gray-soft-secondary border border-border-gray-secondary text-label-sm font-label-sm-strong!  text-text-gray-secondary">
        <Heart className="w-4 h-4 text-text-brand-primary" />
        <span>{reactionCount}</span>
      </div>
    </div>
  );
}
