import {
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  HeartHandshake,
  Lightbulb,
  PiggyBank,
  Rocket,
  SquaresIntersect,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import JobSeekerImage from '@/public/images/job-seekers.png';

export default function UserFeature() {
  return (
    <section className=" py-spacing-10xl max-w-[1280px] mx-auto px-spacing-5xl space-y-spacing-9xl">
      <div className=" grid grid-cols-1 lg:grid-cols-2 gap-spacing-9xl">
        <div className=" space-y-spacing-4xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary uppercase">
            JOB SEEKERS
          </p>
          <div className=" space-y-spacing-2xl">
            <p className=" text-heading-md md:text-heading-lg font-heading-lg-strong! text-text-gray-secondary">
              Find local jobs that match your skills, values and ambitions
            </p>
            <div className=" flex flex-col sm:flex-row sm:items-center gap-spacing-4xl">
              <Link
                href="#"
                className="text-label-lg border border-border-gray-primary rounded-full font-label-lg-strong! text-text-gray-secondary flex items-center h-14 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-gray-soft-primary"
              >
                Create Profile
              </Link>
              <Link
                href="#"
                className="text-label-lg rounded-full font-label-lg-strong! text-text-white flex items-center h-14 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
              >
                Find Jobs
                <ArrowUpRight />
              </Link>
            </div>
          </div>
          <div className=" space-y-spacing-2xl">
            <ListItem
              icon={
                <SquaresIntersect className="text-fg-brand-primary size-6" />
              }
              title="Skills matching"
            />
            <ListItem
              icon={<Lightbulb className="text-fg-brand-primary size-6" />}
              title="Values matching"
            />
            <ListItem
              icon={<Rocket className="text-fg-brand-primary size-6" />}
              title="Faster applications"
            />
            <ListItem
              icon={
                <BriefcaseBusiness className="text-fg-brand-primary size-6" />
              }
              title="Nearby local jobs."
            />
            <ListItem
              icon={<Building2 className="text-fg-brand-primary size-6" />}
              title="Culture-fit employers."
            />
          </div>
        </div>
        <div>
          <Image
            src={JobSeekerImage}
            alt="Job Seeker Image"
            width={568}
            height={516}
            className=" h-full w-full max-h-[516px] object-cover rounded-2xl"
          />
        </div>
      </div>
      <div className=" grid grid-cols-1 lg:grid-cols-2 gap-spacing-9xl">
        <div className="order-2 lg:order-1">
          <Image
            src={JobSeekerImage}
            alt="Job Seeker Image"
            width={568}
            height={516}
            className=" h-full w-full max-h-[516px] object-cover rounded-2xl"
          />
        </div>
        <div className="order-1 lg:order-2 space-y-spacing-4xl">
          <p className=" text-label-sm font-label-sm-strong! text-text-brand-secondary uppercase">
            RECRUITERS
          </p>
          <div className=" space-y-spacing-2xl">
            <p className=" text-heading-md md:text-heading-lg font-heading-lg-strong! text-text-gray-secondary">
              Hire locally. Hire smarter. Hire people who fit not just on paper.
            </p>
            <div className=" flex flex-col sm:flex-row sm:items-center gap-spacing-4xl">
              <Link
                href="#"
                className="text-label-lg border border-border-gray-primary rounded-full font-label-lg-strong! text-text-gray-secondary flex items-center h-14 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-gray-soft-primary"
              >
                Create Profile
              </Link>
              <Link
                href="#"
                className="text-label-lg rounded-full font-label-lg-strong! text-text-white flex items-center h-14 justify-center gap-spacing-xs py-spacing-xl px-spacing-3xl bg-bg-brand-solid-primary"
              >
                Post Jobs
                <ArrowUpRight />
              </Link>
            </div>
          </div>
          <div className=" space-y-spacing-2xl">
            <ListItem
              icon={
                <SquaresIntersect className="text-fg-brand-primary size-6" />
              }
              title="AI shortlisting."
            />
            <ListItem
              icon={<Lightbulb className="text-fg-brand-primary size-6" />}
              title="Values matching"
            />
            <ListItem
              icon={<Rocket className="text-fg-brand-primary size-6" />}
              title="Faster time‑to‑hire"
            />
            <ListItem
              icon={<PiggyBank className="text-fg-brand-primary size-6" />}
              title="Lower-cost hiring."
            />
            <ListItem
              icon={<HeartHandshake className="text-fg-brand-primary size-6" />}
              title="Stronger local Team"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

const ListItem = ({
  icon,
  title,
}: {
  icon: React.ReactNode;
  title: string;
}) => {
  return (
    <div className=" flex items-center gap-spacing-md">
      {icon}
      <p className=" text-label-xl text-text-gray-primary">{title}</p>
    </div>
  );
};
