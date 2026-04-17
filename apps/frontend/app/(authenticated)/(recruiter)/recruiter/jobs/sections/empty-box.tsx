import React from 'react';
import EmptyStateSVG from '@/public/images/Empty_State.svg';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import Image from 'next/image';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function EmptyBox() {
  return (
    <Empty className="border border-dashed p-spacing-4xl!">
      <EmptyHeader>
        <div className="">
          <Image
            className="max-h-50 max-w-[250px] w-[250px] h-50 rounded-full"
            alt="EmptyStateSVG"
            src={EmptyStateSVG}
            width={250}
            height={200}
          />
          <EmptyTitle className=" text-label-xl font-label-xs-strong! text-text-gray-primary">
            No Jobs are Post Yet!
          </EmptyTitle>
        </div>
        <EmptyDescription className=" text-label-md text-text-gray-quaternary">
          Currently, there are no job postings available.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
          <Plus />
          <span>Create New</span>
        </Button>
      </EmptyContent>
    </Empty>
  );
}
