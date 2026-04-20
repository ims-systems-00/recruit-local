import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import React from 'react';
import NewsFeed from './sections/news-feed';

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

      <NewsFeed />
    </div>
  );
}
