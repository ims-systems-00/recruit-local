import React from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Overview from './sections/overview';
import Applicants from './sections/applicants';
const tabs = [
  {
    value: 'overview',
    label: 'Overview',
    component: <Overview />,
  },
  {
    value: 'job-description',
    label: 'Job Description',
    component: <p>Hello</p>,
  },
  {
    value: 'applicants',
    label: 'Applicants',
    component: <Applicants />,
  },

  {
    value: 'interview-schedule',
    label: 'Interview Schedule',
    component: <p>Hello</p>,
  },
];

export default function JobDetailsPage() {
  return (
    <div>
      <div className=" py-spacing-lg px-spacing-4xl border-b border-border-gray-secondary">
        <Breadcrumb className=" min-h-10 flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="/recruiter/job/lists"
                className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary"
              >
                Job Listing
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className=" text-fg-gray-tertiary " />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                JL - 01
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className=" p-spacing-4xl space-y-spacing-4xl">
        <div className=" space-y-spacing-2xs">
          <h3 className=" text-label-xl font-label-xl-strong! text-text-gray-primary">
            UI/UX Designer Wanted – Join Our Creative Team!
          </h3>
          <p className=" capitalize text-label-sm text-text-gray-tertiary">
            Last Updated January 23, 2026
          </p>
        </div>
        <Tabs defaultValue={tabs[0].value} className="w-full gap-spacing-4xl">
          <TabsList className="w-full bg-bg-gray-soft-secondary h-11 justify-start">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="px-spacing-lg text-label-md font-label-md-strong! 
                          data-[state=active]:shadow-sm 
                          flex-0 
                          data-[state=active]:bg-bg-gray-soft-primary 
                          text-text-gray-quaternary 
                          dark:data-[state=active]:text-text-gray-secondary"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
