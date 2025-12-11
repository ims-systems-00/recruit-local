import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { ChevronRight, Ellipsis, Search, X } from 'lucide-react';
import Image from 'next/image';
import React from 'react';
import JobSearchIcon from '@/public/images/jobSearch.svg';
import { Input } from '@/components/ui/input';

import { AppWindowIcon, CodeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function JobLists() {
  return (
    <div>
      <header className="py-4 px-6 flex justify-between items-center">
        <div className=" space-y-3">
          <h3>Explore All Jobs</h3>
          <p>Browse the full range of available opportunities</p>
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
      <div className="p-6 grid grid-cols-3 gap-6 ">
        <div className=" col-span-2 p-5 bg-surface-lighter space-y-10 rounded-xl">
          <div className="space-y-5">
            <h4>Hi , Want to Hire talent?</h4>
            <div className=" flex items-center gap-4">
              <div className="min-w-8">
                <Image
                  className="max-h-8 max-w-8"
                  alt="Fav"
                  src={JobSearchIcon}
                  width={32}
                  height={32}
                />
              </div>
              <Input
                className="h-12 rounded-full text-base"
                type="text"
                placeholder="Write a post for a job"
              />
            </div>
          </div>
          <Tabs defaultValue="active-jobs" className="w-full space-y-4">
            <TabsList className="w-full bg-surface-lighter p-1 border border-border h-10">
              <TabsTrigger
                value="active-jobs"
                className="h-8 data-[state=active]:text-primary text-body"
              >
                Active Jobs
              </TabsTrigger>
              <TabsTrigger
                value="archived-jobs"
                className="h-8 data-[state=active]:text-primary text-body"
              >
                Archived jobs
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active-jobs">
              <div className="space-y-4">
                {[1, 2, 3].map((item) => (
                  <div
                    key={item}
                    className="border border-border p-4 rounded-2xl bg-white space-y-3 shadow-sm"
                  >
                    <div className="flex justify-between items-center gap-6">
                      <p className="text-sm text-body">XJ-486</p>
                      <div className="flex items-center gap-5">
                        <span>
                          <Ellipsis className="w-5 h-5 text-title" />
                        </span>
                        <span>
                          <X className="w-5 h-5 text-title" />
                        </span>
                      </div>
                    </div>
                    <div className=" relative overflow-hidden bg-primary-extra-ighter h-32 rounded-lg flex justify-center items-center">
                      <span className=" absolute left-0 top-0">
                        <svg
                          width="464"
                          height="128"
                          viewBox="0 0 464 128"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g filter="url(#filter0_f_502_165672)">
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
                              id="filter0_f_502_165672"
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
                                result="effect1_foregroundBlur_502_165672"
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
                          width="474"
                          height="128"
                          viewBox="0 0 474 128"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <g filter="url(#filter0_f_502_165671)">
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
                              id="filter0_f_502_165671"
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
                                result="effect1_foregroundBlur_502_165671"
                              />
                            </filter>
                          </defs>
                        </svg>
                      </span>
                    </div>
                    <div className=" space-y-4">
                      <h4>UI/UX Designer Wanted – Join Our Creative Team!</h4>
                      <div className=" flex justify-between gap-2">
                        <div className="space-y-3 flex-1">
                          <p className="text-sm text-body">Applicants</p>
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
                        <div className="flex-1 pl-2 border-l border-border space-y-3 ">
                          <p className="text-sm text-body">Applied</p>
                          <p className="text-title">Applicants</p>
                        </div>
                        <div className="flex-1 pl-2 border-l border-border space-y-3">
                          <p className="text-sm text-body">Posted</p>
                          <div className="space-y-1">
                            <p className="text-sm text-title ">Jan 19, 2022</p>
                            <p className="text-xs">3:45 pm</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="archived-jobs"></TabsContent>
          </Tabs>
        </div>
        <div className="bg-white rounded-xl p-6 space-y-6 border border-border h-fit">
          <div className="space-y-3">
            <h4>Profile Updated Applicants</h4>
            <p className="text-sm">See who recently updated their profile</p>
          </div>
          <div className=" flex justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <span className=" flex py-0.5 px-2.5 rounded-[6px] bg-white text-sm text-body">
                All
              </span>
              <span className=" flex py-0.5 px-2.5 rounded-[6px] bg-card text-sm text-primary">
                Recent
              </span>
            </div>
            <span className="text-sm text-title">See all</span>
          </div>
          <div className=" space-y-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <div
                key={item}
                className=" flex justify-between items-center gap-4 p-4 border-b-[0.5px] border-border-dark last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <Avatar className=" size-8">
                    <AvatarImage
                      src="https://github.com/shadcn.png"
                      alt="@shadcn"
                    />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                  <div className=" space-y-2">
                    <p className="text-title">Annette Black</p>
                    <p className="text-sm">Applied on 15 May 2020 9:30 am</p>
                  </div>
                </div>
                <span className=" flex items-center justify-center border border-border h-6 w-6 rounded-lg bg-card">
                  <ChevronRight className="w-5 h-5 text-body" />
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
