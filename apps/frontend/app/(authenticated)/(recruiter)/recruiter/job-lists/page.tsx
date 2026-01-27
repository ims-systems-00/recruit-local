'use client';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ArrowRight, ChevronRight, Ellipsis, Search, X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import JobSearchIcon from '@/public/images/jobSearch.svg';
import { Input } from '@/components/ui/input';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Can } from '@/authz/ability-context';
import { AbilityAction } from '@rl/types';
import { JobAuthZEntity } from '@rl/authz';

export default function JobLists() {
  return (
    <div>
      <div className=" border-b border-border-secondary">
        <header className="p-spacing-4xl flex justify-between items-center">
          <div className=" space-y-spacing-2xs">
            <h3 className="text-text-primary text-heading-sm font-heading-sm-strong!">
              Explore All Jobs
            </h3>
            <p className=" text-text-tertiary text-label-md">
              Browse the full range of available opportunities
            </p>
          </div>
          <div className="min-w-[356px]">
            <InputGroup className="max-w-[356px] h-10">
              <InputGroupInput placeholder="Search..." />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
          </div>
        </header>
      </div>
      <div className="p-spacing-4xl grid grid-cols-3 gap-spacing-4xl ">
        <div className=" col-span-2 bg-surface-lighter space-y-spacing-4xl rounded-xl">
          <div className="space-y-5 border border-border-secondary p-spacing-2xl rounded-lg">
            <h4 className="text-text-secondary text-label-lg font-label-lg-strong!">
              Hi , Want to Hire talent?
            </h4>
            <div className=" flex items-center gap-4">
              <div className="min-w-8">
                <Image
                  className="max-h-12 max-w-12"
                  alt="Fav"
                  src={JobSearchIcon}
                  width={48}
                  height={48}
                />
              </div>
              <Input
                className="h-12 rounded-full text-base"
                type="text"
                placeholder="Write a post for a job"
              />
            </div>
          </div>
          <Tabs
            defaultValue="active-jobs"
            className="w-full space-y-spacing-2xl"
          >
            <TabsList className="w-full bg-bg-secondary p-1 border border-border-secondary h-10">
              <TabsTrigger
                value="active-jobs"
                className="h-8 data-[state=active]:bg-bg-primary data-[state=active]:text-text-secondary text-text-quaternary"
              >
                Active Jobs
              </TabsTrigger>
              <TabsTrigger
                value="archived-jobs"
                className="h-8 data-[state=active]:bg-bg-primary data-[state=active]:text-text-secondary text-text-quaternary"
              >
                Archived jobs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active-jobs">
              <div className="space-y-spacing-2xl">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="border border-border-secondary rounded-2xl bg-bg-primary shadow-xs"
                  >
                    <div className=" p-spacing-4xl space-y-spacing-4xl">
                      <div className=" space-y-spacing-sm">
                        <div className="flex justify-between items-center gap-spacing-4xl">
                          <p className=" text-label-sm text-text-tertiary">
                            XJ-486
                          </p>
                          <div className="flex items-center gap-5">
                            <span>
                              <Ellipsis className="w-5 h-5 text-title" />
                            </span>
                          </div>
                        </div>
                        <h4 className=" text-label-lg font-label-lg-strong! text-text-primary">
                          UI/UX Designer Wanted – Join Our Creative Team!
                        </h4>
                      </div>
                      <div className=" relative overflow-hidden bg-primary-extra-ighter h-25 rounded-lg flex justify-center items-center">
                        <span className=" absolute left-0 top-0">
                          <svg
                            width="464"
                            height="100"
                            viewBox="0 0 464 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g filter="url(#filter0_f_1760_103063)">
                              <circle
                                cx="121"
                                cy="72"
                                r="243"
                                fill="#67C3E4"
                                fillOpacity="0.26"
                              />
                            </g>
                            <defs>
                              <filter
                                id="filter0_f_1760_103063"
                                x="-222"
                                y="-271"
                                width="686"
                                height="686"
                                filterUnits="userSpaceOnUse"
                                colorInterpolationFilters="sRGB"
                              >
                                <feFlood
                                  floodOpacity="0"
                                  result="BackgroundImageFix"
                                />
                                <feBlend
                                  mode="normal"
                                  in="SourceGraphic"
                                  in2="BackgroundImageFix"
                                  result="shape"
                                />
                                <feGaussianBlur
                                  stdDeviation="50"
                                  result="effect1_foregroundBlur_1760_103063"
                                />
                              </filter>
                            </defs>
                          </svg>
                        </span>
                        <div className="space-y-1.5 relative z-10">
                          <p className="text-title">Wanna Join us?</p>
                          <p className="text-xs text-title">Apply Now!! </p>
                          <p className="text-xs text-title">
                            www.BootTech/apply{' '}
                          </p>
                        </div>
                        <span className=" absolute right-0 top-0">
                          <svg
                            width="442"
                            height="100"
                            viewBox="0 0 442 100"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g filter="url(#filter0_f_1760_103062)">
                              <circle
                                cx="303.5"
                                cy="26.5"
                                r="203.5"
                                fill="#017C89"
                                fillOpacity="0.28"
                              />
                            </g>
                            <defs>
                              <filter
                                id="filter0_f_1760_103062"
                                x="0"
                                y="-277"
                                width="607"
                                height="607"
                                filterUnits="userSpaceOnUse"
                                colorInterpolationFilters="sRGB"
                              >
                                <feFlood
                                  floodOpacity="0"
                                  result="BackgroundImageFix"
                                />
                                <feBlend
                                  mode="normal"
                                  in="SourceGraphic"
                                  in2="BackgroundImageFix"
                                  result="shape"
                                />
                                <feGaussianBlur
                                  stdDeviation="50"
                                  result="effect1_foregroundBlur_1760_103062"
                                />
                              </filter>
                            </defs>
                          </svg>
                        </span>
                      </div>
                    </div>
                    <div className=" border-t border-border-secondary flex justify-between gap-2.5 px-spacing-4xl py-spacing-2xl">
                      <div className="space-y-spacing-2xs flex-1">
                        <p className="text-label-sm text-text-tertiary">
                          Applicants
                        </p>
                        <div className="flex items-center">
                          {[1, 2, 3, 4].map((item) => (
                            <Avatar
                              key={item}
                              className=" size-6 -ml-1.5 first:ml-0 border border-white"
                            >
                              <AvatarImage
                                src="https://github.com/shadcn.png"
                                alt="@shadcn"
                              />
                              <AvatarFallback>CN</AvatarFallback>
                            </Avatar>
                          ))}
                          <Avatar className="-ml-1.5 size-6 bg-gray-200 border border-white text-xs">
                            <AvatarFallback>+7</AvatarFallback>
                          </Avatar>
                        </div>
                      </div>
                      <div className="flex-1 pl-2 border-l border-border-secondary-alt space-y-spacing-2xs ">
                        <p className="text-label-sm text-text-tertiary">
                          Applied
                        </p>
                        <p className=" text-body-sm font-body-sm-strong! text-text-secondary">
                          88
                        </p>
                      </div>
                      <div className="flex-1 pl-2 border-l border-border-secondary-alt space-y-spacing-2xs">
                        <p className="text-label-sm text-text-tertiary">
                          Posted
                        </p>
                        <p className="text-body-sm font-body-sm-strong! text-text-secondary ">
                          2 hours ago
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="archived-jobs"></TabsContent>
          </Tabs>
        </div>
        <div className="bg-white rounded-xl p-spacing-4xl space-y-spacing-4xl border border-border-secondary shadow-xs h-fit">
          <div className="space-y-spacing-3xs">
            <h4 className="text-label-lg font-label-lg-strong! text-text-primary">
              Profile Updated Applicants
            </h4>
            <p className=" text-body-sm text-text-tertiary">
              See who recently updated their profile
            </p>
          </div>
          <div className=" flex justify-between items-center gap-spacing-4xl">
            <div className="flex items-center gap-2">
              <span className=" flex py-spacing-2xs px-spacing-md rounded-lg bg-bg-brand-solid-primary border border-border-brand text-label-xs font-label-xs-strong! text-text-white">
                All
              </span>
              <span className=" flex py-spacing-2xs px-spacing-md rounded-lg bg-bg-primary text-label-xs font-label-xs-strong! text-text-tertiary border border-border-primary">
                Recent
              </span>
            </div>
            <span className=" text-label-sm text-text-tertiary">See all</span>
          </div>
          <div className=" space-y-spacing-2xl">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className="flex w-full items-center gap-spacing-2xl  p-spacing-2xl 2xl:gap-4xl 2xl:p-spacing-4xl border border-border rounded-2xl"
              >
                <Avatar className=" size-12">
                  <AvatarImage
                    src="https://github.com/shadcn.png"
                    alt="@shadcn"
                  />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className=" space-y-spacing-3xs w-full">
                  <div className=" flex justify-between items-start font-[600px] gap-4 w-full">
                    <p className="text-text-primary text-label-lg font-label-lg-strong!">
                      Annette Black
                    </p>
                    <ArrowRight className="w-5 h-5 text-fg-secondary" />
                  </div>
                  <p className="text-label-sm text-text-tertiary">
                    Applied on 15 May 2020 9:30 am
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
