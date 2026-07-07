import { ArrowUpRight, BadgeCheck, Brain, Scale, Target } from 'lucide-react';
import Link from 'next/link';
import React from 'react';
import Image from 'next/image';
import KeyAspectsFirstImage from '@/public/images/key-aspects-first-img.png';
import KeyAspectsSecondImage from '@/public/images/key-aspects-two.svg';
import KeyAspectsThirdImage from '@/public/images/key-aspects-three.svg';
import KeyAspectsFourthImage from '@/public/images/key-aspects-four.svg';
import KeyAspectsFifthImage from '@/public/images/key-aspects-five.svg';

export default function KeyAspects() {
  return (
    <section>
      <div className="max-w-[1280px] mx-auto px-spacing-5xl py-spacing-10xl flex flex-col gap-y-spacing-8xl">
        <div className=" flex flex-col items-center justify-center text-center gap-y-spacing-4xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary uppercase">
            KEY ASPECTS
          </p>
          <div className=" space-y-spacing-2xl">
            <p className=" text-heading-md md:text-heading-xl font-heading-xl-strong! max-w-[768px] text-text-gray-primary">
              Why Recruit Local Matters
            </p>
            <p className="text-body-md text-text-gray-secondary max-w-[768px]">
              We prioritize your career by deeply aligning your ambitions and
              values with roles where you can excel, grow, and truly feel a
              genuine sense of belonging.
            </p>
          </div>
        </div>
        <div className=" grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-spacing-4xl">
          <div className=" overflow-hidden relative md:col-span-2 p-spacing-4xl rounded-2xl border border-border-gray-secondary bg-bg-gray-soft-primary min-h-[416px]">
            <div className=" relative z-1 space-y-spacing-2xl max-w-[383px]">
              <div className=" space-y-spacing-3xl">
                <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-secondary">
                  {`Built for local labour markets`}
                </p>
                <p className=" text-body-md text-text-gray-secondary">
                  Connecting local employers with the right talent through
                  smarter, values-based hiring.
                </p>
              </div>
              <Link
                href="#"
                className=" text-label-sm font-label-sm-strong! text-text-brand-primary flex items-center gap-spacing-2xs"
              >
                Learn More
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
            <Image
              src={KeyAspectsFirstImage}
              alt="Key Aspects"
              width={800}
              height={416}
              className=" absolute inset-0 h-full w-full max-h-[416px] object-cover object-center"
            />
          </div>
          <div className=" overflow-hidden flex flex-col justify-between gap-spacing-4xl p-spacing-4xl rounded-2xl border border-border-gray-secondary bg-bg-gray-soft-primary">
            <Image
              src={KeyAspectsSecondImage}
              alt="Key Aspects"
              width={345}
              height={129}
              className=" h-full w-full max-h-[129px] object-cover"
            />
            <div className=" space-y-spacing-2xl">
              <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-secondary">
                Designed for SMEs & community employers
              </p>
              <p className=" text-body-md text-text-gray-secondary">
                Built specifically for SMEs and community-focused employers who
                need a smarter, simpler.
              </p>
            </div>
          </div>
          <div className=" overflow-hidden flex flex-col items-center justify-between gap-spacing-5xl  rounded-2xl border border-border-gray-secondary bg-bg-gray-soft-primary">
            <div className=" space-y-spacing-2xl p-spacing-4xl">
              <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-secondary">
                Better candidates, fewer applications
              </p>
              <p className=" text-body-md text-text-gray-secondary">
                Hire the right people without sorting through hundreds of
                applications.
              </p>
            </div>
            <Image
              src={KeyAspectsThirdImage}
              alt="Key Aspects"
              width={285}
              height={116}
              className=" h-full w-full max-w-[285px] max-h-[116px] object-cover"
            />
          </div>
          <div className=" overflow-hidden flex flex-col justify-between gap-spacing-5xl  rounded-2xl border border-border-gray-secondary bg-bg-gray-soft-primary">
            <div className=" space-y-spacing-2xl p-spacing-4xl">
              <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-secondary">
                Values‑led and inclusive
              </p>
              <p className=" text-body-md text-text-gray-secondary">
                Hire the right people without sorting through hundreds of
                applications.
              </p>
            </div>
            <Image
              src={KeyAspectsFourthImage}
              alt="Key Aspects"
              width={345}
              height={128}
              className=" h-full w-full max-h-[128px] object-cover"
            />
          </div>
          <div className=" overflow-hidden flex flex-col justify-between gap-spacing-5xl  rounded-2xl border border-border-gray-secondary bg-bg-gray-soft-primary">
            <div className=" space-y-spacing-2xl p-spacing-4xl">
              <p className=" text-heading-sm font-heading-sm-strong! text-text-gray-secondary">
                Keeps talent local
              </p>
              <p className=" text-body-md text-text-gray-secondary">
                Hire the right people without sorting through hundreds of
                applications.
              </p>
            </div>
            <Image
              src={KeyAspectsFifthImage}
              alt="Key Aspects"
              width={345}
              height={128}
              className=" h-full w-full max-h-[128px] object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
