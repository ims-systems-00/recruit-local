import { cn } from '@/lib/utils';
import { POST_TYPE_ENUMS } from '@rl/types';
import React, { useState } from 'react';
import AllActivities from './all-activities';
import PostActivities from './post-activities';
import ArticleActivities from './article-activities';

const tabs = [
  {
    id: 1,
    value: 'all',
    label: 'All',
  },
  {
    id: 2,
    value: POST_TYPE_ENUMS.POST,
    label: 'Posts',
  },
  {
    id: 3,
    value: POST_TYPE_ENUMS.ARTICLE,
    label: 'Articles',
  },
];

export default function Activities() {
  const [activeTab, setActiveTab] = useState(tabs[0].value);

  const handleTabClick = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className=" space-y-spacing-4xl">
      <div className=" space-y-spacing-2xl">
        <h4 className=" text-text-gray-primary text-label-xl font-label-xl-strong!">
          Activities
        </h4>
        <div className=" flex gap-spacing-sm items-center">
          {tabs.map((tab) => (
            <span
              key={tab.id}
              onClick={() => handleTabClick(tab.value)}
              className={cn(
                ' cursor-pointer px-spacing-md py-spacing-2xs bg-bg-gray-soft-primary border border-border-gray-primary rounded-lg text-label-xs font-label-xs-strong! text-text-gray-secondary',
                activeTab === tab.value &&
                  ' bg-bg-brand-solid-primary border-bg-brand-solid-primary text-white',
              )}
            >
              {tab.label}
            </span>
          ))}
        </div>
      </div>
      {activeTab === 'all' && <AllActivities />}
      {activeTab === POST_TYPE_ENUMS.POST && <PostActivities />}
      {activeTab === POST_TYPE_ENUMS.ARTICLE && <ArticleActivities />}
    </div>
  );
}
