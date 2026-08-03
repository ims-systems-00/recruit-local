import { EllipsisVertical, Heart } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import SavesDefault from '@/public/images/saves_default.png';
import moment from 'moment';

interface PostItemProps {
  description?: string;
  creator?: string;
  creatorImage?: string;
  creatorIndustry?: string;
  postedAt?: string;
  likes?: number;
}

export default function PostItem({
  description,
  creator,
  creatorImage,
  creatorIndustry,
  postedAt,
  likes,
}: PostItemProps) {
  return (
    <div className=" rounded-2xl border border-border-gray-secondary flex flex-col items-center">
      <div className="p-spacing-4xl space-y-spacing-4xl w-full">
        <div className=" flex justify-between gap-spacing-lg items-start w-full">
          <div className="flex items-center gap-spacing-lg">
            <div>
              <Image
                className="max-h-12 h-12 w-12 rounded-full"
                alt="SavesDefault"
                src={creatorImage || SavesDefault}
                height={48}
                width={48}
              />
            </div>
            <div className="space-y-spacing-2xs">
              <div className=" flex items-center gap-spacing-sm ">
                <p className=" text-label-md font-label-md-strong! text-text-gray-primary">
                  {creator}
                </p>
              </div>

              <div className=" flex items-center gap-spacing-sm text-text-gray-tertiary ">
                <p className=" text-label-xs text-text-gray-tertiary capitalize">
                  {creatorIndustry}
                </p>
                <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
                <p className="text-label-xs text-text-gray-tertiary">
                  {moment(postedAt).format('DD MMM YYYY h:mm a')}
                </p>
              </div>
            </div>
          </div>
          <span className=" min-w-5 inline-block">
            <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
          </span>
        </div>

        <p className=" text-label-sm text-text-gray-tertiary line-clamp-3">
          {description}
        </p>
        <div className=" flex gap-spacing-sm items-center justify-between w-full">
          <div className=" w-fit flex gap-spacing-2xs justify-center items-center rounded-full px-spacing-sm py-spacing-3xs bg-bg-gray-soft-secondary border border-border-gray-secondary text-label-sm font-label-sm-strong!  text-text-gray-secondary">
            <Heart className="w-4 h-4 text-text-brand-primary" />
            <span>100</span>
          </div>
          <span className=" cursor-pointer text-label-sm font-label-sm-strong! text-text-gray-secondary">
            View Post
          </span>
        </div>
      </div>
    </div>
  );
}
