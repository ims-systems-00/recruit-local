import { ArrowUpRight } from 'lucide-react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import React from 'react';

interface BlogCardProps {
  image: string | StaticImageData;
  title: string;
  description: string;
  readTime: string;
  date: string;
  url: string;
}
export default function BlogCard({
  image,
  title,
  description,
  readTime,
  url = '#',
  date,
}: BlogCardProps) {
  return (
    <div className=" border border-border-gray-tertiary rounded-4xl bg-bg-gray-soft-primary p-spacing-5xl space-y-spacing-4xl">
      <div>
        <Image
          src={image}
          alt="Job Seeker Image"
          width={325}
          height={189}
          className=" h-full w-full max-h-[189px] object-cover rounded-lg"
        />
      </div>
      <div className=" space-y-spacing-2xl">
        <div className="flex items-center gap-spacing-xs">
          <span className=" text-label-sm text-text-gray-quaternary">
            {date}
          </span>
          <div className=" flex items-center gap-spacing-2xs">
            <div className="w-1.5 h-1.5 rounded-full bg-others-gray-default"></div>
            <span className=" text-label-sm text-text-gray-quaternary">
              {readTime} mins read
            </span>
          </div>
        </div>
        <div className=" space-y-spacing-md">
          <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary line-clamp-1">
            {title}
          </p>
          <p className=" text-body-md text-text-gray-secondary line-clamp-2">
            {description}
          </p>
        </div>
        <Link
          href={url}
          className="text-label-md font-label-md-strong! text-text-brand-secondary flex items-center gap-spacing-xs "
        >
          Read more
          <ArrowUpRight />
        </Link>
      </div>
    </div>
  );
}
