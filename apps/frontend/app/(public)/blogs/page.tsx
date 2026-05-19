import React from 'react';
import Banner from './sections/banner';

import BlogOneImage from '@/public/images/blog-1.jpg';
import BlogTwoImage from '@/public/images/blog-2.png';
import BlogThreeImage from '@/public/images/blog-3.jpg';
import BlogCard from './sections/blog-card';
import FeaturedBlogCard from './sections/featured-blog-card';
import AuthorImage from '@/public/images/author-default.png';

export default function BlogsPage() {
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
        <div className=" space-y-spacing-4xl">
          <div>
            <FeaturedBlogCard
              image={BlogOneImage}
              title="Recruit Local Launches Oldham Trading Platform Transforming Job Search and Hiring Across UK Smart Cities"
              url="/blogs/recruit-local-launches-oldham-trading-platform-transforming-job-search-and-hiring-across-uk-smart-cities"
              authorName="Anwar Ali"
              authorRole="CEO & Founder"
              authorImage={AuthorImage}
            />
          </div>
          <div className=" grid md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
            <BlogCard
              image={BlogOneImage}
              title="Stand Out Faster"
              description="Learn how job seekers can improve resumes and get noticed."
              readTime="7"
              date="10 jan, 2026"
              url="/blogs/stand-out-faster"
            />
            <BlogCard
              image={BlogTwoImage}
              title="Build Better Teams"
              description="Explore smarter ways to attract and retain top talent."
              readTime="7"
              date="10 jan, 2026"
              url="/blogs/build-better-teams"
            />
            <BlogCard
              image={BlogThreeImage}
              title="Career Success"
              description="Simple career advice to help professionals grow with confidence."
              readTime="7"
              date="10 jan, 2026"
              url="/blogs/career-success"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
