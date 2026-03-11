import { Button } from '@/components/ui/button';
import { EllipsisVertical, MapPin, Plus } from 'lucide-react';
import React from 'react';

export default function CurrentRecruitment() {
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center">
        <h4 className=" text-text-gray-secondary text-heading-sm font-heading-sm-strong!">
          Current Recruitment
        </h4>
        <div className=" flex items-center gap-spacing-lg">
          <Button className=" bg-bg-brand-solid-primary h-10 text-white! rounded-lg text-label-sm font-label-sm-strong!">
            <span>
              <Plus />
            </span>
            Create
          </Button>
        </div>
      </div>
      <div className=" grid grid-cols-3 gap-spacing-2xl">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className=" rounded-2xl border border-border-gray-secondary flex flex-col items-center"
          >
            <div className="p-spacing-4xl space-y-spacing-2xs w-full">
              <div className=" flex justify-between gap-spacing-lg items-start w-full">
                <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                  Product Designer
                </p>
                <span className=" min-w-5 inline-block">
                  <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
                </span>
              </div>
              <div className=" flex items-center gap-spacing-2xs text-text-gray-tertiary ">
                <MapPin className=" size-4" />
                <p className=" text-label-sm">Dhaka, Bangladesh</p>
              </div>
            </div>
            <div className="space-y-spacing-lg border-t border-border-gray-secondary w-full">
              <div className="  py-spacing-2xl px-spacing-4xl ">
                <span className="text-label-sm pr-spacing-sm">Onsite</span>
                <span className="text-label-sm border-l border-border-gray-secondary-alt px-spacing-sm">
                  65,000 TK
                </span>
                <span className="text-label-sm border-l border-border-gray-secondary-alt px-spacing-sm">
                  5 days
                </span>
                <span className="text-label-sm border-l border-border-gray-secondary-alt px-spacing-sm">
                  10:00 to 6 :00
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
