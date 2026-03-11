import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EllipsisVertical, Plus } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import AchievementsDefault from '@/public/images/achievements_default.png';

export default function Achievements() {
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center">
        <h4 className=" text-text-gray-secondary text-heading-sm font-heading-sm-strong!">
          Achievements
        </h4>
        <div className=" flex items-center gap-spacing-lg">
          <Select>
            <SelectTrigger className="w-full max-w-48 text-label-sm! h-10! font-label-sm-strong! rounded-lg! text-text-gray-secondary">
              <SelectValue placeholder="Newest" />
            </SelectTrigger>
            <SelectContent className=" bg-bg-gray-soft-primary">
              <SelectGroup>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
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
            className=" rounded-2xl border border-border-gray-secondary p-spacing-4xl flex flex-col gap-spacing-4xl items-center"
          >
            <div className=" space-y-spacing-2xs">
              <div className=" flex justify-between gap-spacing-lg items-start w-full">
                <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                  Won 'Best Workplace' Award
                </p>
                <span className=" min-w-5 inline-block">
                  <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
                </span>
              </div>
              <p className=" text-text-gray-tertiary text-label-sm">
                Collaborations with industry leaders like Grameenphone and
                DataSoft
              </p>
            </div>
            <div className=" space-y-spacing-lg">
              <div>
                <Image
                  className="max-h-[186px] rounded-md w-full"
                  alt="AchievementsDefault"
                  src={AchievementsDefault}
                  height={186}
                />
              </div>
              <div className=" flex gap-spacing-sm items-center text-label-sm ">
                <span className=" font-label-sm-strong">Posted</span>
                <span>26 jan, 2026</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
