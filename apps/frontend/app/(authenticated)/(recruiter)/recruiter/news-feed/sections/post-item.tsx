'use client';
import React, { useState } from 'react';
import Image from 'next/image';
import { EllipsisVertical, Heart } from 'lucide-react';
import moment from 'moment';
import { PostImage } from '@/services/post';
import SavesDefault from '@/public/images/saves_default.png';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { cn } from '@/lib/utils';

export default function PostItem({
  title,
  createdAt,
  text,
  images,
}: {
  title: string;
  createdAt: string;
  text: string;
  images?: PostImage[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isLongText = text?.length > 200;
  const displayText =
    isExpanded || !isLongText ? text : `${text.slice(0, 200)}...`;
  return (
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
                {title}
              </p>
            </div>

            <div className=" flex items-center gap-spacing-sm text-text-gray-tertiary ">
              <p className=" text-label-sm text-text-gray-tertiary">
                IT Company
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
        <div>
          <p className=" text-body-sm text-text-gray-tertiary">{displayText}</p>
          {isLongText && (
            <span
              onClick={() => setIsExpanded(!isExpanded)}
              className=" cursor-pointer text-label-sm text-text-brand-primary"
            >
              {isExpanded ? 'See less' : 'See more'}
            </span>
          )}
        </div>
        {images && images.length > 0 && (
          <div>
            {/* Less than 2 images: carousel only on small/medium screens */}
            {images.length < 3 ? (
              <>
                {/* Mobile / tablet */}
                <div className={cn('lg:hidden', images.length < 2 && 'hidden')}>
                  <Carousel>
                    <CarouselContent>
                      {images.map((image) => (
                        <CarouselItem key={image._id}>
                          <Image
                            src={image.src}
                            alt={image.storageInformation.Name}
                            width={400}
                            height={202}
                            className="w-full h-full max-h-[400px] object-cover rounded-2xl"
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>

                    <CarouselPrevious className="cursor-pointer left-5 bg-bg-gray-soft-secondary border-border-gray-primary text-fg-gray-primary" />
                    <CarouselNext className="cursor-pointer right-5 bg-bg-gray-soft-secondary border-border-gray-primary text-fg-gray-primary" />
                  </Carousel>
                </div>

                {/* Large screens */}
                <div
                  className={cn(
                    'hidden lg:grid grid-cols-2 gap-spacing-xl',
                    images.length < 2 && 'grid grid-cols-1',
                  )}
                >
                  {images.map((image) => (
                    <Image
                      key={image._id}
                      src={image.src}
                      alt={image.storageInformation.Name}
                      width={400}
                      height={202}
                      className="w-full h-full max-h-[400px] object-cover rounded-2xl"
                    />
                  ))}
                </div>
              </>
            ) : (
              /* 2+ images: always carousel */
              <Carousel>
                <CarouselContent>
                  {images.map((image) => (
                    <CarouselItem
                      key={image._id}
                      className="lg:basis-1/2 xl:basis-1/3"
                    >
                      <Image
                        src={image.src}
                        alt={image.storageInformation.Name}
                        width={400}
                        height={202}
                        className="w-full h-full max-h-[400px] object-cover rounded-2xl"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>

                <CarouselPrevious className="cursor-pointer left-5 bg-bg-gray-soft-secondary border-border-gray-primary text-fg-gray-primary" />
                <CarouselNext className="cursor-pointer right-5 bg-bg-gray-soft-secondary border-border-gray-primary text-fg-gray-primary" />
              </Carousel>
            )}
          </div>
        )}
      </div>
      <div className=" w-fit flex gap-spacing-2xs justify-center items-center rounded-full px-spacing-sm py-spacing-3xs bg-bg-gray-soft-secondary border border-border-gray-secondary text-label-sm font-label-sm-strong!  text-text-gray-secondary">
        <Heart className="w-4 h-4 text-text-brand-primary" />
        <span>100</span>
      </div>
    </div>
  );
}
