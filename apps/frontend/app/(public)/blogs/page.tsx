import React from 'react';
import Banner from './sections/banner';

import BlogCard from './sections/blog-card';
import FeaturedBlogCard from './sections/featured-blog-card';
import { client } from '@/sanity/lib/client';
import { BLOGS_LIST_QUERY } from '@/sanity/lib/queries';
import EmptyBox from '@/components/empty-box';

export interface SanityBlog {
  slug: { current: string };
  title: string;
  date: string;
  description: string;
  thumbnailUrl?: string;
  author?: {
    name: string;
    role?: string;
    avatarSrc?: string;
  };
}

export default async function BlogsPage() {
  const blogs: SanityBlog[] = await client.fetch(
    BLOGS_LIST_QUERY,
    {},
    { next: { revalidate: 10 } },
  );

  if (!blogs) return null;

  const [featuredBlog, ...restBlogs] = blogs || [];

  return (
    <div>
      <Banner />
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl space-y-spacing-8xl">
        <div className=" flex flex-col items-center justify-center text-center gap-y-spacing-3xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary">
            BLOGS & INSIGHTS
          </p>
          <p className=" text-heading-lg font-heading-lg-strong! text-text-gray-primary">
            Learn What Great Recruiters Know{' '}
          </p>
          <p className=" text-body-md text-text-gray-secondary">
            Expert insights, hiring tips, and career advice for recruiters and
            job seekers
          </p>
        </div>
        {Boolean(blogs?.length) ? (
          <div className=" space-y-spacing-4xl">
            <div>
              <FeaturedBlogCard
                image={featuredBlog.thumbnailUrl || ''}
                title={featuredBlog.title}
                url={`/blogs/${featuredBlog.slug.current}`}
                authorName={featuredBlog.author?.name || ''}
                authorRole={featuredBlog.author?.role || ''}
                authorImage={featuredBlog.author?.avatarSrc || ''}
              />
            </div>
            <div className=" grid md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
              {restBlogs.map((blog, index) => (
                <BlogCard
                  key={index}
                  image={blog.thumbnailUrl || ''}
                  title={blog.title}
                  description={blog.description}
                  readTime="7"
                  date={blog.date}
                  url={`/blogs/${blog.slug.current}`}
                />
              ))}
            </div>
          </div>
        ) : (
          <EmptyBox title="No Blogs Found" description="No blogs found" />
        )}
      </div>
    </div>
  );
}
