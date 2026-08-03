import { EllipsisVertical, Heart } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import moment from 'moment';

interface ArticleItemProps {
  title?: string;
  image?: string;
  postedAt?: string;
  likes?: number;
}
export default function ArticleItem({
  title,
  image,
  postedAt,
  likes,
}: ArticleItemProps) {
  return (
    <div className=" rounded-2xl border border-border-gray-secondary flex flex-col items-center">
      <div className="p-spacing-4xl space-y-spacing-4xl w-full">
        <div className=" flex justify-between gap-spacing-lg items-start w-full">
          <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
            {title}
          </p>
          <span className=" min-w-5 inline-block">
            <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
          </span>
        </div>

        <div>
          <Image
            src={image || RecruitProfileDefault}
            alt="Article Banner"
            width={1000}
            height={120}
            className="rounded-xl max-h-[120px] h-[120px] w-full object-cover"
          />
        </div>
        <div className=" flex gap-spacing-sm items-center justify-between w-full">
          <span className=" text-label-sm text-text-gray-tertiary flex items-center gap-spacing-xs">
            <span className=" font-label-sm-strong! text-text-gray-primary">
              Posted
            </span>
            {moment(postedAt).format('DD MMM, YYYY')}
          </span>
          <div className=" w-fit flex gap-spacing-2xs justify-center items-center rounded-full px-spacing-sm py-spacing-3xs bg-bg-gray-soft-secondary border border-border-gray-secondary text-label-sm font-label-sm-strong!  text-text-gray-secondary">
            <Heart className="w-4 h-4 text-text-brand-primary" />
            <span>100</span>
          </div>
        </div>
      </div>
    </div>
  );
}
