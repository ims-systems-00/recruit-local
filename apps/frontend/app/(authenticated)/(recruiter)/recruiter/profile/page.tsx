import Image from 'next/image';
import React from 'react';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import { Button } from '@/components/ui/button';
import { Globe, Linkedin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import About from './sections/about';

export default function Profile() {
  return (
    <div>
      <header className=" p-spacing-4xl rounded-2xl">
        <div className=" h-[244px] relative">
          <Image
            className="max-h-[244px] rounded-3xl w-full"
            alt="Logo"
            src={RecruitProfileDefault}
            height={244}
          />

          <div className=" w-40 h-40 absolute -bottom-[100px] left-0">
            <Image
              className="max-h-40 max-w-40 w-40 h-40 rounded-full"
              alt="Logo"
              src={RecruitDefaultLogo}
              width={160}
              height={160}
            />
          </div>
        </div>
        <div className=" pl-44 flex justify-between items-center gap-4 py-spacing-xl">
          <div className=" space-y-spacing-sm">
            <h4 className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
              Boot Tech
            </h4>
            <div className=" flex items-center gap-spacing-xs">
              <Button variant="outline" className=" h-9 w-9">
                <Linkedin className=" text-fg-gray-secondary size-4" />
              </Button>
              <Button variant="outline" className=" h-9 w-9">
                <Globe className=" text-fg-gray-secondary size-4" />
              </Button>
            </div>
          </div>
          <Button
            variant="outline"
            className=" border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
          >
            Edit Profile
          </Button>
        </div>
      </header>
      <div className="px-spacing-4xl pb-spacing-4xl">
        <Tabs defaultValue="account" className=" w-full gap-spacing-4xl ">
          <TabsList className=" w-full bg-bg-gray-soft-secondary h-11 justify-start">
            <TabsTrigger
              value="account"
              className=" px-spacing-lg text-label-md font-label-md-strong! data-[state=active]:shadow-sm flex-0 data-[state=active]:bg-bg-gray-soft-primary text-text-gray-quaternary dark:data-[state=active]:text-text-gray-secondary"
            >
              About
            </TabsTrigger>
            <TabsTrigger
              value="password"
              className="px-spacing-lg text-label-md font-label-md-strong! data-[state=active]:shadow-sm flex-0 data-[state=active]:bg-bg-gray-soft-primary text-text-gray-quaternary dark:data-[state=active]:text-text-gray-secondary"
            >
              Services and Products
            </TabsTrigger>
          </TabsList>
          <TabsContent value="account">
            <About />
          </TabsContent>
          <TabsContent value="password">Change your password here.</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
