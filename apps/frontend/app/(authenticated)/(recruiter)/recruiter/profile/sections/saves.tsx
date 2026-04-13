import { Button } from '@/components/ui/button';
import { EllipsisVertical, MapPin, Plus } from 'lucide-react';
import React from 'react';
import Image from 'next/image';
import SavesDefault from '@/public/images/saves_default.png';

export default function Saves() {
  return (
    <div className=" space-y-spacing-4xl">
      <div className=" flex justify-between items-center">
        <h4 className=" text-text-gray-secondary text-heading-sm font-heading-sm-strong!">
          Saves
        </h4>
        <div className=" flex items-center gap-spacing-lg"></div>
      </div>
      <div className=" grid grid-cols-1 gap-spacing-2xl">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <div
            key={item}
            className=" rounded-2xl border border-border-gray-secondary flex flex-col items-center"
          >
            <div className="p-spacing-4xl space-y-spacing-4xl w-full">
              <div className=" flex justify-between gap-spacing-lg items-start w-full">
                <div>
                  <Image
                    className="max-h-10 h-10 w-10 rounded-full"
                    alt="AchievementsDefault"
                    src={SavesDefault}
                    height={40}
                    width={40}
                  />
                </div>
                <span className=" min-w-5 inline-block">
                  <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
                </span>
              </div>
              <div className="space-y-spacing-2xs">
                <div className=" flex items-center gap-spacing-sm ">
                  <p className=" text-label-lg font-label-lg-strong! text-text-gray-primary">
                    Training & Workshop Sessions
                  </p>
                  <div className=" flex justify-center items-center rounded-md px-spacing-md py-spacing-3xs bg-others-gray-gray-zero border border-others-gray-light text-label-xs font-label-xs-strong!  text-others-gray-dark">
                    Virtual
                  </div>
                </div>

                <div className=" flex items-center gap-spacing-2xs text-text-gray-tertiary ">
                  <p className=" text-label-sm">
                    Hands-on sessions to upskill your team in digital tools,
                    leadership, and inclusive hiring.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-spacing-lg border-t border-border-gray-secondary w-full">
              <div className="  py-spacing-2xl px-spacing-4xl ">
                <div className=" flex justify-between items-center">
                  <div className=" flex gap-spacing-sm items-center text-label-sm ">
                    <span className=" font-label-sm-strong">5 sits left</span>
                    <span>Posted 4 days ago</span>
                  </div>
                  <div className=" flex items-center gap-spacing-lg">
                    <Button
                      variant="outline"
                      className=" shadow-none! bg-transparent! border-0! h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                    >
                      See details
                    </Button>
                    <Button
                      variant="outline"
                      className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                    >
                      Register now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
