'use client';
import React from 'react';
import Image, { StaticImageData } from 'next/image';
import EmptyStateSVG from '@/public/images/Empty_State.svg';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';

type EmptyBoxProps = {
  title: string;
  description?: string;
  image?: StaticImageData | string;
  children?: React.ReactNode;
};

export default function EmptyBox({
  title,
  description,
  image,
  children,
}: EmptyBoxProps) {
  return (
    <Empty className="border border-dashed p-spacing-4xl!">
      <EmptyHeader className=" max-w-full">
        <div>
          <Image
            className="max-h-50 max-w-[250px] w-[250px] h-50 rounded-full"
            alt="empty-state"
            src={image || EmptyStateSVG}
            width={250}
            height={200}
          />

          <EmptyTitle className="text-label-xl font-label-xs-strong! text-text-gray-primary">
            {title}
          </EmptyTitle>
        </div>

        {description && (
          <EmptyDescription className="text-label-md text-text-gray-quaternary">
            {description}
          </EmptyDescription>
        )}
      </EmptyHeader>

      <EmptyContent>{children}</EmptyContent>
    </Empty>
  );
}
