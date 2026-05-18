import Image from 'next/image';
import React from 'react';
import BlogDetailsBanner from '@/public/images/blog-details-banner.png';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import BlogCard from '../sections/blog-card';
import AuthorImage from '@/public/images/author-default.png';

import BlogOneImage from '@/public/images/blog-1.jpg';
import BlogTwoImage from '@/public/images/blog-2.png';
import BlogThreeImage from '@/public/images/blog-3.jpg';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function BlogDetailsPage({ params }: PageProps) {
  const { slug } = await params;

  return (
    <div>
      <div className=" max-w-[920px] mx-auto py-spacing-9xl px-spacing-5xl space-y-spacing-6xl">
        <div className=" space-y-spacing-6xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary">
            POSTED ON JAN 24 , 2026
          </p>
          <p className=" text-heading-lg font-heading-lg-strong! text-text-gray-primary">
            Recruit Local Launches Oldham Trading Platform Transforming Job
            Search and Hiring Across UK Smart Cities
          </p>
          <p className=" text-body-md text-text-gray-tertiary">
            As Recruit Local scales, it can offer a complete package for local
            economies. Whilst much of the potential relies on engagement and
            investment from relevant parties, it can serve as a local hub to
            manage career-development, recruitment, education, and local
            authorities.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-xl transition-all max-h-[488px]">
          <Image
            src={BlogDetailsBanner}
            alt={'blog image'}
            width={1000}
            height={488}
            className="w-full h-full rounded-5xl max-h-[488px] object-cover"
          />

          <div className=" absolute bottom-0 left-0 right-0 p-spacing-3xl md:p-spacing-5xl bg-linear-to-t from-black/95 via-black/50 to-transparent transition-opacity duration-1000 ">
            <p className="text-white text-body-sm">
              Recruit Local is an innovative platform developed by Upturn Social
              Enterprise, designed to address employment challenges within the
              Greater Manchester region. The platform aims to connect local job
              seekers, employers, and training providers, facilitating job
              matching, skill development, and community engagement.
            </p>
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
        <div className=" bg-bg-brand-soft-secondary p-spacing-6xl rounded-4xl flex gap-spacing-6xl items-end">
          <div className="shrink-0">
            <Image
              src={AuthorImage}
              alt={'author image'}
              width={280}
              height={280}
              className="w-full h-full rounded-lg max-w-[280px] max-h-[280px] object-cover"
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
              This is a great opportunity for Oldham businesses to work together
              and support each other. By keeping trade local, we can help our
              economy grow, create more jobs, and make it easier for businesses
              to find the services they need right on their doorstep.
            </p>
            <div className=" space-y-spacing-3xs">
              <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-primary">
                Arooj Shah
              </p>
              <p className=" text-body-md text-text-gray-tertiary">
                Councilor, Leader of Oldham Council
              </p>
            </div>
          </div>
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
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl space-y-spacing-8xl">
        <p className=" text-heading-lg font-heading-lg-strong! text-text-gray-primary">
          More Other Blogs
        </p>
        <div className=" grid md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
          <BlogCard
            image={BlogOneImage}
            title="Stand Out Faster"
            description="Learn how job seekers can improve resumes and get noticed."
            readTime="7"
            date="10 jan, 2026"
            url="#"
          />
          <BlogCard
            image={BlogTwoImage}
            title="Build Better Teams"
            description="Explore smarter ways to attract and retain top talent."
            readTime="7"
            date="10 jan, 2026"
            url="#"
          />
          <BlogCard
            image={BlogThreeImage}
            title="Career Success"
            description="Simple career advice to help professionals grow with confidence."
            readTime="7"
            date="10 jan, 2026"
            url="#"
          />
        </div>
      </div>
    </div>
  );
}
