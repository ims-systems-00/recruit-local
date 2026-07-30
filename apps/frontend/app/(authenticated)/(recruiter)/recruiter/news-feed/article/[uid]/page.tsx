import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { getPostById } from '@/services/post';
import Link from 'next/link';
import React from 'react';
import ArticleDetails from './sections/article-details';

type PageProps = {
  params: Promise<{ uid: string }>;
};

export default async function ArticlePage({ params }: PageProps) {
  const { uid } = await params;

  const response = await getPostById(uid);

  if (!response.success) {
    return <div>Failed to load article</div>;
  }

  const article = response.data;

  console.log(article, 'article');

  return (
    <div>
      <div className=" py-spacing-lg px-spacing-4xl border-b border-border-gray-secondary">
        <Breadcrumb className=" min-h-10 flex items-center">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link
                href={`/recruiter/news-feed`}
                className=" text-label-sm font-label-sm-strong! text-text-gray-quaternary"
              >
                News Feed
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator className=" text-fg-gray-tertiary " />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-label-sm font-label-sm-strong! py-spacing-2xs px-spacing-md rounded-md bg-bg-brand-soft-primary text-text-brand-primary">
                {response.data.title}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <ArticleDetails item={article} />
    </div>
  );
}
