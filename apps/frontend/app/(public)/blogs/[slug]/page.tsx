import Image from 'next/image';
import React, { Fragment } from 'react';
import BlogDetailsBanner from '@/public/images/blog-details-banner.png';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import BlogCard from '../sections/blog-card';
import AuthorImage from '@/public/images/author-default.png';

import BlogOneImage from '@/public/images/blog-1.jpg';
import BlogTwoImage from '@/public/images/blog-2.png';
import BlogThreeImage from '@/public/images/blog-3.jpg';
import { client } from '@/sanity/lib/client';
import { BLOG_QUERY, OTHER_INSIGHTS_QUERY } from '@/sanity/lib/queries';
import { notFound } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import { SanityBlog } from '../page';
import DraftViewer from '@/components/draft-editor/draft-viewer';
import VideoPlayer from '@/components/video-player';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogDetailsPage({ params }: PageProps) {
  const { slug } = await params;
  // const post = await client.fetch(
  //   BLOG_QUERY,
  //   { slug: slug },
  //   { next: { revalidate: 10 } },
  // );
  const [post, otherInsights] = await Promise.all([
    client.fetch(BLOG_QUERY, { slug: slug }, { next: { revalidate: 10 } }),
    client.fetch(
      OTHER_INSIGHTS_QUERY,
      { slug: slug },
      { next: { revalidate: 10 } },
    ),
  ]);
  if (!post) {
    return notFound();
  }
  const { title, date, description, thumbnail, author, content } = post;

  console.log(content, 'content');
  return (
    <div>
      <div className=" max-w-[920px] mx-auto py-spacing-9xl px-spacing-5xl space-y-spacing-6xl">
        <div className=" space-y-spacing-6xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary">
            POSTED ON {formatDate(date)}
          </p>
          <p className=" text-heading-lg font-heading-lg-strong! text-text-gray-primary">
            {title}
          </p>
          <p className=" text-body-md text-text-gray-tertiary">{description}</p>
        </div>
        <div className="relative overflow-hidden rounded-xl transition-all max-h-[488px]">
          <Image
            src={thumbnail?.asset?.url || ''}
            alt={title}
            width={1000}
            height={488}
            className="w-full h-full rounded-5xl max-h-[488px] object-cover"
          />

          <div className=" absolute bottom-0 left-0 right-0 p-spacing-3xl md:p-spacing-5xl bg-linear-to-t from-black/95 via-black/50 to-transparent transition-opacity duration-1000 ">
            <p className="text-white text-body-sm">{description}</p>
          </div>
        </div>
        <Link
          href="#"
          target="_blank"
          className="text-label-md font-label-md-strong! text-text-brand-secondary flex items-center gap-spacing-xs "
        >
          View In LinkedIn
          <ArrowUpRight />
        </Link>

        <div className=" space-y-spacing-6xl">
          {Boolean(content?.length) &&
            content?.map((item: any, index: number) => (
              <div key={index} className="text-body-md text-text-gray-primary ">
                {item._type === 'classicEditor' && (
                  <DraftViewer key={index} content={item.htmlString} />
                )}
                {item._type === 'quoteCard' && (
                  <div className=" bg-bg-brand-soft-secondary p-spacing-6xl rounded-4xl flex gap-spacing-6xl items-end">
                    <div className="shrink-0">
                      <Image
                        src={item?.personImage?.asset?.url || ''}
                        alt={item?.name || ''}
                        width={280}
                        height={280}
                        className="w-full h-full rounded-lg min-w-[280px] min-h-[280px] max-w-[280px] max-h-[280px] object-cover"
                      />
                    </div>
                    <div className=" space-y-spacing-lg">
                      <span className=" inline-block">
                        <svg
                          width="30"
                          height="26"
                          viewBox="0 0 30 26"
                          fill="none"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            d="M16.0727 26V14.4662C16.0727 7.7215 21.7822 2.23913 25.3417 0.07204C25.7934 -0.202576 26.2806 0.368435 25.9354 0.768048C24.9718 1.88356 21.1342 6.08138 20.4123 12.4132H29.7818V26H16.0727Z"
                            fill="#364153"
                          />
                          <path
                            d="M-2.57492e-05 26V14.4662C-2.57492e-05 7.7215 5.70945 2.23913 9.26892 0.07204C9.72063 -0.202576 10.2078 0.368435 9.86261 0.768048C8.89904 1.88356 5.06148 6.08138 4.33955 12.4132H13.7091V26H-2.57492e-05Z"
                            fill="#364153"
                          />
                        </svg>
                      </span>
                      <p className=" text-body-md text-text-gray-primary italic">
                        {item?.quote || ''}
                      </p>
                      <div className=" space-y-spacing-3xs">
                        <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
                          {item?.name || ''}
                        </p>
                        <p className=" text-body-md text-text-gray-tertiary">
                          {item?.designation || ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {item._type === 'youtubeVideo' && (
                  <VideoPlayer videoSrc={item?.url || ''} />
                )}
              </div>
            ))}
        </div>
        <p className="text-body-md text-text-gray-primary">
          As of Spring 2024, a pilot version of the application has been
          developed, showcasing an ability to upload and manage vacancies, as
          well as for job hunters to search for and apply for these roles.
        </p>
        <div className=" space-y-spacing-3xl">
          <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
            Why we questioned the rhythm
          </p>
          <p className=" text-body-md text-text-gray-secondary">
            Upturn Social Enterprise has a long-standing history of supporting
            individuals from disadvantaged communities in securing various types
            of employment, such as volunteering, apprenticeships, and
            full/part-time positions. Over the past fifteen years, <br /> <br />{' '}
            Through continuous engagement with numerous businesses and
            organisations, Upturn has explored recruitment needs and shaped
            effective hiring practices that are financially viable and support
            ongoing business growth <br /> <br /> Upturn has assisted more than
            2,000 individuals, including young people, those from BAME and
            diverse backgrounds, individuals with disabilities, those facing
            mental health challenges, carers, and returners of both genders, in
            finding employment across the private, public, and third sectors, as
            well as charitable organisations.
          </p>
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-2 gap-spacing-3xl">
          <div>
            <Image
              src={BlogDetailsBanner}
              alt={'blog image'}
              width={1000}
              height={240}
              className="w-full h-full rounded-2xl max-h-[240px] object-cover"
            />
          </div>
          <div>
            <Image
              src={BlogDetailsBanner}
              alt={'blog image'}
              width={1000}
              height={240}
              className="w-full h-full rounded-2xl max-h-[240px] object-cover"
            />
          </div>
          <div>
            <Image
              src={BlogDetailsBanner}
              alt={'blog image'}
              width={1000}
              height={240}
              className="w-full h-full rounded-2xl max-h-[240px] object-cover"
            />
          </div>
          <div>
            <Image
              src={BlogDetailsBanner}
              alt={'blog image'}
              width={1000}
              height={240}
              className="w-full h-full rounded-2xl max-h-[240px] object-cover"
            />
          </div>
        </div>
        <div className=" space-y-spacing-3xl">
          <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
            What About Frameworks? The Magic 10X?
          </p>
          <ul className=" ml-spacing-4xl list-disc space-y-spacing-3xl text-body-md text-text-gray-primary">
            <li>
              There are more and more new frameworks for working with LLMs every
              day. Open Spec and BMAD are very popular. I built a website with a
              modified version of Spec Kitty. It was really nice, especially
              early on in the project. These are great tools and I encourage you
              to try them out.{' '}
              <Link href="#" className=" text-text-brand-secondary">
                See what works for you.
              </Link>
            </li>
            <li>
              There are more and more new frameworks for working with LLMs every
              day. Open Spec and BMAD are very popular. I built a website with a
              modified version of Spec Kitty. It was really nice, especially
              early on in the project. These are great tools and I encourage you
              to try them out.{' '}
              <Link href="#" className=" text-text-brand-secondary">
                See what works for you.
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <Image
            src={BlogDetailsBanner}
            alt={'blog image'}
            width={1000}
            height={362}
            className="w-full h-full rounded-2xl max-h-[362px] object-cover"
          />
        </div>
      </div>
      {Boolean(otherInsights?.length) && (
        <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl space-y-spacing-8xl">
          <p className=" text-heading-lg font-heading-lg-strong! text-text-gray-primary">
            More Other Blogs
          </p>
          <div className=" grid md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
            {otherInsights?.map((blog: SanityBlog, index: number) => (
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
      )}
    </div>
  );
}
