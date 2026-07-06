import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowUpRight } from 'lucide-react';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import React from 'react';

interface FeaturedBlogCardProps {
  image: string | StaticImageData;
  title: string;
  url: string;
  authorName: string;
  authorRole: string;
  authorImage: string | StaticImageData;
}
export default function FeaturedBlogCard({
  image,
  title,
  url = '#',
  authorName,
  authorRole,
  authorImage,
}: FeaturedBlogCardProps) {
  return (
    <div className=" border border-border-gray-tertiary rounded-4xl bg-bg-gray-soft-primary p-spacing-5xl flex flex-col lg:flex-row gap-spacing-4xl">
      <div>
        <Image
          src={image}
          alt="Job Seeker Image"
          width={532}
          height={310}
          className=" sm:min-w-[532px] h-full w-full max-h-[310px] max-w-[532px] object-cover rounded-lg"
        />
      </div>
      <div className=" flex flex-col justify-between gap-y-spacing-2xl">
        <div className=" space-y-spacing-lg">
          <p className=" text-heading-md font-heading-md-strong! text-text-gray-primary line-clamp-4">
            {title}
          </p>
          <Link
            href={url}
            className="text-label-md font-label-md-strong! text-text-brand-secondary flex items-center gap-spacing-xs "
          >
            Read more
            <ArrowUpRight />
          </Link>
        </div>
        <div className=" flex items-center gap-spacing-lg">
          <Avatar className=" size-14 border border-border-gray-tertiary items-center justify-center">
            <AvatarImage
              src={
                typeof authorImage === 'string' ? authorImage : authorImage.src
              }
            />
            <AvatarFallback>{authorName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className=" text-body-lg font-body-lg-strong! text-text-gray-primary">
              {authorName}
            </p>
            <p className=" text-label-md  text-text-gray-quinary">
              {authorRole}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
