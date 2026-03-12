import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import SavesDefault from '@/public/images/saves_default.png';

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import {
  Bookmark,
  EllipsisVertical,
  Forward,
  Heart,
  ImageIcon,
  Search,
  TextInitial,
} from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

export default function NewsFeedPage() {
  return (
    <div>
      <div className=" py-spacing-lg px-spacing-4xl border-b border-border-gray-secondary">
        <Breadcrumb className=" min-h-10 flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                News Feed
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className=" p-spacing-4xl space-y-spacing-4xl">
        <div className=" flex justify-between items-center gap-spacing-2xl">
          <div className=" space-y-spacing-2xs">
            <h3 className=" text-body-lg font-body-lg-strong! text-text-gray-primary">
              Good Morning, BootTech
            </h3>
            <p className=" capitalize text-label-sm text-text-gray-tertiary">
              Share updates, find talent, and stay informed with Recruit Local.
            </p>
          </div>
          <InputGroup className=" max-w-[400px] h-10 rounded-lg shadow-xs border-border-gray-primary">
            <InputGroupInput type="text" placeholder="Search..." />
            <InputGroupAddon>
              <Search className=" text-fg-gray-tertiary" />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="space-y-spacing-4xl max-h-[calc(100vh-166px)] overflow-y-auto">
          <div className=" p-spacing-2xl border border-border-gray-secondary rounded-2xl space-y-spacing-4xl">
            <div className=" space-y-spacing-xs">
              <p className=" text-label-md font-label-md-strong! text-text-gray-secondary">
                Start your post
              </p>
              <p className=" text-label-sm text-text-gray-tertiary">
                Tell the community what’s happening today!
              </p>
            </div>
            <div className=" flex gap-spacing-lg">
              <div className=" min-w-12">
                <Image
                  className="max-h-12 max-w-12 w-12 h-12 rounded-full "
                  alt="Logo"
                  src={RecruitDefaultLogo}
                  width={48}
                  height={48}
                />
              </div>
              <div className=" space-y-spacing-2xl w-full">
                <Input
                  className=" focus-visible:ring-0! w-full h-12 rounded-lg text-label-md placeholder:text-text-gray-tertiary text-text-gray-secondary"
                  type="text"
                  placeholder="Write a post for in Newsfeed"
                />
                <div className=" flex items-center gap-spacing-lg">
                  <div className=" flex gap-spacing-2xs items-center">
                    <ImageIcon className=" w-4 h-4 text-fg-gray-secondary" />
                    <span className=" text-label-sm text-text-gray-quaternary">
                      Media
                    </span>
                  </div>
                  <div className=" flex gap-spacing-2xs items-center">
                    <TextInitial className=" w-4 h-4 text-fg-gray-secondary" />
                    <span className=" text-label-sm text-text-gray-quaternary">
                      Article
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className=" rounded-2xl border border-border-gray-secondary flex flex-col items-center"
            >
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
                          Training & Workshop Sessions
                        </p>
                      </div>

                      <div className=" flex items-center gap-spacing-sm text-text-gray-tertiary ">
                        <p className=" text-label-sm text-text-gray-tertiary">
                          IT Company
                        </p>
                        <div className=" inline-block w-1.5 h-1.5 rounded-full bg-fg-gray-tertiary"></div>
                        <p className="text-label-sm text-text-gray-tertiary">
                          15 May 2020 9:30 am
                        </p>
                      </div>
                    </div>
                  </div>
                  <span className=" min-w-5 inline-block">
                    <EllipsisVertical className=" size-5 text-fg-gray-secondary" />
                  </span>
                </div>

                <div>
                  <p>
                    Habitant morbi tristique senectus et netus et. Suspendisse
                    sed nisi lacus sed viverra. Dolor morbi non arcu risus quis
                    varius. #amazing #great #lifetime #uiux #machinelearning
                  </p>
                </div>
                <div className=" w-fit flex gap-spacing-2xs justify-center items-center rounded-full px-spacing-sm py-spacing-3xs bg-bg-gray-soft-secondary border border-border-gray-secondary text-label-sm font-label-sm-strong!  text-text-gray-secondary">
                  <Heart className="w-4 h-4 text-text-brand-primary" />
                  <span>231</span>
                </div>
              </div>
              <div className="space-y-spacing-lg border-t border-border-gray-secondary w-full">
                <div className="  py-spacing-2xl px-spacing-4xl ">
                  <div className=" grid grid-cols-3 gap-spacing-2xl">
                    <div className=" w-full flex items-center justify-center gap-spacing-2xs">
                      <Heart className="w-5 h-5 text-text-brand-primary" />
                      <p className="text-label-sm font-label-sm-strong! text-text-brand-primary">
                        Like
                      </p>
                    </div>
                    <div className=" w-full flex items-center justify-center gap-spacing-2xs">
                      <Forward className="w-5 h-5 text-fg-gray-secondary" />
                      <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
                        Share
                      </p>
                    </div>
                    <div className=" w-full flex items-center justify-center gap-spacing-2xs">
                      <Bookmark className="w-5 h-5 text-fg-gray-secondary" />
                      <p className="text-label-sm font-label-sm-strong! text-text-gray-tertiary">
                        Save
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
