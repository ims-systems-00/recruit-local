'use client';
import Image from 'next/image';
import React, { useCallback, useMemo, useState } from 'react';
import RecruitProfileDefault from '@/public/images/recruit_profile_default.svg';
import RecruitDefaultLogo from '@/public/images/recruit_default_logo.png';
import { Button } from '@/components/ui/button';
import { Globe, Linkedin } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import About from '../sections/about';
import ServicesAndProducts from '../sections/services-and-products';
import Achievements from '../sections/achievements';
import CurrentRecruitment from '../sections/current-recruitment';
import Saves from '../sections/saves';
import Activities from '../sections/activities';
import { TenantData } from '@/services/tenants/tenants.type';
import EditProfile from './edit-profile';

export default function Profile({ tenantData }: { tenantData: TenantData }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('about');

  const [tenantDetails, setTenantDetails] = useState(tenantData);

  const tabs = [
    {
      value: 'about',
      label: 'About',
      component: isEditMode ? (
        <EditProfile defaultValues={tenantDetails} />
      ) : (
        <About />
      ),
      editable: true,
    },
    {
      value: 'services-and-products',
      label: 'Services and Products',
      component: <ServicesAndProducts />,
      editable: true,
    },
    {
      value: 'achievements',
      label: 'Achievements',
      component: <Achievements />,
    },
    {
      value: 'current-recruitment',
      label: 'Current Recruitment',
      component: <CurrentRecruitment />,
    },
    {
      value: 'activities',
      label: 'Activities',
      component: <Activities />,
    },
    {
      value: 'saves',
      label: 'Saves',
      component: <Saves />,
    },
  ];

  const visibleTabs = useMemo(() => {
    if (!isEditMode) return tabs;
    return tabs.filter((tab) => tab.editable);
  }, [isEditMode, tabs]);

  const handleEdit = useCallback(() => {
    setIsEditMode(true);
    setActiveTab('about');
  }, []);

  const handleCancelEdit = useCallback(() => {
    setIsEditMode(false);
    setActiveTab('about');
  }, []);

  return (
    <div>
      <header className=" p-spacing-4xl rounded-2xl">
        <div className=" h-[244px] relative">
          <Image
            className="max-h-[244px] rounded-3xl w-full object-cover h-full"
            alt="Recruit Profile Default"
            src={RecruitProfileDefault}
            height={244}
          />

          <div className=" w-40 h-40 absolute -bottom-[100px] left-0">
            <Image
              className="max-h-40 max-w-40 w-40 h-40 rounded-full "
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
              {tenantData?.name}
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

          <div className="flex gap-2">
            {isEditMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  form="tenant-edit-form"
                  className="cursor-pointer h-10 rounded-lg bg-bg-brand-solid-primary text-white! text-label-sm font-label-sm-strong!"
                >
                  Save
                </Button>
              </>
            ) : (
              <Button
                onClick={handleEdit}
                variant="outline"
                className=" cursor-pointer border-border-gray-primary h-10 rounded-lg text-label-sm font-label-sm-strong! text-text-gray-primary"
              >
                Edit Profile
              </Button>
            )}
          </div>
        </div>
      </header>
      <div className="px-spacing-4xl pb-spacing-4xl">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full gap-spacing-4xl"
        >
          <TabsList className="w-full bg-bg-gray-soft-secondary h-11 justify-start">
            {visibleTabs.map((tab) => (
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

          {visibleTabs.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {tab.component}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}
